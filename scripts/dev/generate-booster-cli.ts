import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generateSealedPool } from "../../packages/shared/src/booster/generateSealedPool.js";
import { seededRandom, secureRandom, type RandomFn } from "../../packages/shared/src/booster/rng.js";
import type { Card } from "../../packages/shared/src/types/card.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = path.join(__dirname, "../../packages/shared/data/cards.json");

function parseSeedArg(): number | null {
  const arg = process.argv.find((a) => a.startsWith("--seed="));
  if (!arg) return null;
  return Number(arg.split("=")[1]);
}

async function main() {
  const cards: Card[] = JSON.parse(await readFile(CARDS_PATH, "utf-8"));
  const cardsById = new Map(cards.map((c) => [c.id, c]));

  const seed = parseSeedArg();
  const rng: RandomFn = seed !== null ? seededRandom(seed) : secureRandom;

  const entries = generateSealedPool(cards, rng);

  const result = entries
    .map((entry) => {
      const card = cardsById.get(entry.cardId)!;
      return { name: card.name, rarity: card.rarity, count: entry.count };
    })
    .sort((a, b) => a.rarity.localeCompare(b.rarity) || a.name.localeCompare(b.name));

  console.log(JSON.stringify(result, null, 2));

  const totals = result.reduce<Record<string, number>>((acc, r) => {
    acc[r.rarity] = (acc[r.rarity] ?? 0) + r.count;
    return acc;
  }, {});
  console.error("Totais por raridade:", totals, "| soma:", Object.values(totals).reduce((a, b) => a + b, 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
