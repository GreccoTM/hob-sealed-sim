import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SET_CODE = "hob";
const SEARCH_URL = `https://api.scryfall.com/cards/search?q=e%3A${SET_CODE}&unique=cards&order=set`;
const R2_BUCKET = "hob-card-images";
const REQUEST_DELAY_MS = 75;
const MAX_RETRIES = 5;
const USER_AGENT = "HobSealedSim/1.0 (contact: grecco.tm@gmail.com)";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, ".image-cache");
const MANIFEST_PATH = path.join(CACHE_DIR, "uploaded.json");

type Manifest = Record<string, true>;

interface ScryfallCardImage {
  id: string;
  image_uris?: { normal: string; large: string };
}

interface ScryfallSearchResponse {
  data: ScryfallCardImage[];
  has_more: boolean;
  next_page?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fonte das imagens: busca direto na Scryfall (não em cards.json, que já guarda
// as URLs do R2 — usá-lo como fonte criaria uma dependência circular).
async function fetchScryfallImages(): Promise<ScryfallCardImage[]> {
  const all: ScryfallCardImage[] = [];
  let url: string | undefined = SEARCH_URL;

  while (url) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Scryfall retornou ${response.status} para ${url}`);
    const page: ScryfallSearchResponse = await response.json();
    all.push(...page.data);
    url = page.has_more ? page.next_page : undefined;
    if (url) await sleep(100);
  }

  return all;
}

async function loadManifest(): Promise<Manifest> {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(await readFile(MANIFEST_PATH, "utf-8"));
}

async function saveManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

async function downloadWithRetry(url: string, destPath: string): Promise<void> {
  if (existsSync(destPath)) return;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "image/*" } });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "2");
      await sleep(retryAfter * 1000 * attempt);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destPath, buffer);
    return;
  }
  throw new Error(`Excedeu ${MAX_RETRIES} tentativas baixando ${url}`);
}

async function uploadToR2(objectKey: string, localPath: string): Promise<void> {
  await execFileAsync("wrangler", [
    "r2",
    "object",
    "put",
    `${R2_BUCKET}/${objectKey}`,
    `--file=${localPath}`,
    "--remote",
  ]);
}

async function main() {
  console.log("Buscando URLs de imagem na Scryfall...");
  const cards = await fetchScryfallImages();
  await mkdir(CACHE_DIR, { recursive: true });
  const manifest = await loadManifest();

  let downloaded = 0;
  let uploaded = 0;
  let skipped = 0;

  for (const card of cards) {
    if (!card.image_uris) continue;
    const cardDir = path.join(CACHE_DIR, card.id);
    await mkdir(cardDir, { recursive: true });

    const sizes: Array<["normal" | "large", string]> = [
      ["normal", card.image_uris.normal],
      ["large", card.image_uris.large],
    ];

    for (const [size, url] of sizes) {
      const localPath = path.join(cardDir, `${size}.jpg`);
      const objectKey = `cards/${card.id}/${size}.jpg`;

      const alreadyLocal = existsSync(localPath);
      if (!alreadyLocal) {
        await downloadWithRetry(url, localPath);
        downloaded++;
        await sleep(REQUEST_DELAY_MS);
      }

      if (!manifest[objectKey]) {
        await uploadToR2(objectKey, localPath);
        manifest[objectKey] = true;
        uploaded++;
        await saveManifest(manifest);
      } else {
        skipped++;
      }
    }
  }

  console.log(`Baixadas: ${downloaded} novas. Enviadas ao R2: ${uploaded}. Já existiam: ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  console.error(
    "\nDica: este script precisa do bucket R2 já criado e do wrangler autenticado " +
      "(`wrangler login`, `wrangler r2 bucket create hob-card-images`) antes de rodar a etapa de upload.",
  );
  process.exit(1);
});
