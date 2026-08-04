import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Card, CardFace, Layout } from "../../packages/shared/src/types/card.js";

const SET_CODE = "hob";
const SEARCH_URL = `https://api.scryfall.com/cards/search?q=e%3A${SET_CODE}&unique=cards&order=set`;
const USER_AGENT = "HobSealedSim/1.0 (contact: grecco.tm@gmail.com)";
const PAGE_DELAY_MS = 100;

// As imagens são servidas pelo próprio Worker (rota /images/cards/<id>/<file>),
// não pelo domínio público r2.dev — a Cloudflare documenta o r2.dev como não
// recomendado para produção (instável/rate-limited). Sobrescrevível via env var
// caso a URL do Worker mude.
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL ?? "https://hob-sealed-sim-worker.hob-worker.workers.dev/images";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "../../packages/shared/data/cards.json");

interface ScryfallCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
}

interface ScryfallCard {
  id: string;
  name: string;
  layout: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string[];
  color_identity?: string[];
  rarity: string;
  collector_number: string;
  card_faces?: ScryfallCardFace[];
  image_uris?: { normal: string; large: string };
}

interface ScryfallSearchResponse {
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toLayout(scryfallLayout: string): Layout {
  if (scryfallLayout === "adventure") return "adventure";
  if (scryfallLayout === "saga") return "saga";
  return "normal";
}

function toFaces(card: ScryfallCard): CardFace[] | null {
  if (!card.card_faces || card.card_faces.length === 0) return null;
  return card.card_faces.map((face) => ({
    name: face.name,
    manaCost: face.mana_cost ?? null,
    typeLine: face.type_line ?? card.type_line,
    oracleText: face.oracle_text ?? null,
    power: face.power ?? null,
    toughness: face.toughness ?? null,
  }));
}

function transform(card: ScryfallCard): Card {
  const isBasicLand = card.type_line.includes("Basic Land");
  const isNonbasicLand = !isBasicLand && card.type_line.includes("Land");

  if (!card.image_uris) {
    throw new Error(
      `Carta "${card.name}" (${card.id}) não tem image_uris no nível raiz — verificar layout especial não previsto.`,
    );
  }

  return {
    id: card.id,
    name: card.name,
    layout: toLayout(card.layout),
    manaCost: card.mana_cost ?? null,
    cmc: card.cmc,
    typeLine: card.type_line,
    oracleText: card.oracle_text ?? null,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    colors: card.colors ?? [],
    colorIdentity: card.color_identity ?? [],
    rarity: card.rarity as Card["rarity"],
    collectorNumber: card.collector_number,
    faces: toFaces(card),
    isBasicLand,
    isNonbasicLand,
    boosterEligible: !isBasicLand,
    image: {
      normalUrl: `${IMAGE_BASE_URL}/cards/${card.id}/normal.jpg`,
      largeUrl: `${IMAGE_BASE_URL}/cards/${card.id}/large.jpg`,
    },
  };
}

async function fetchAllCards(): Promise<ScryfallCard[]> {
  const all: ScryfallCard[] = [];
  let url: string | undefined = SEARCH_URL;

  while (url) {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Scryfall retornou ${response.status} para ${url}`);
    }
    const page: ScryfallSearchResponse = await response.json();
    all.push(...page.data);
    url = page.has_more ? page.next_page : undefined;
    if (url) await sleep(PAGE_DELAY_MS);
  }

  return all;
}

async function main() {
  console.log(`Buscando cartas do set ${SET_CODE.toUpperCase()} na Scryfall...`);
  const rawCards = await fetchAllCards();
  console.log(`Recebidas ${rawCards.length} cartas únicas.`);

  const cards = rawCards.map(transform);

  const byRarity = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.rarity] = (acc[c.rarity] ?? 0) + 1;
    return acc;
  }, {});
  console.log("Distribuição por raridade:", byRarity);

  await writeFile(OUTPUT_PATH, JSON.stringify(cards, null, 2) + "\n", "utf-8");
  console.log(`Gravado em ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
