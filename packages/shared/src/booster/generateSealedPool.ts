import type { Card } from "../types/card.js";
import { BOOSTERS_PER_SEALED } from "./config.js";
import { buildCardPool, generateBooster } from "./generateBooster.js";
import type { RandomFn } from "./rng.js";

export interface SealedPoolEntry {
  cardId: string;
  count: number;
}

/** Abre BOOSTERS_PER_SEALED boosters e agrega o resultado por carta. */
export function generateSealedPool(cards: Card[], rng: RandomFn): SealedPoolEntry[] {
  const pool = buildCardPool(cards);
  const counts = new Map<string, number>();

  for (let i = 0; i < BOOSTERS_PER_SEALED; i++) {
    const booster = generateBooster(pool, rng);
    for (const card of booster) {
      counts.set(card.id, (counts.get(card.id) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([cardId, count]) => ({ cardId, count }));
}
