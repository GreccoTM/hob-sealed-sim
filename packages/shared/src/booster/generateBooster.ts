import type { Card, Rarity } from "../types/card.js";
import { CARDS_PER_BOOSTER, MYTHIC_ODDS, WILDCARD_FOIL_WEIGHTS, WILDCARD_NONFOIL_WEIGHTS } from "./config.js";
import type { RandomFn } from "./rng.js";

export type CardPool = Record<Rarity, Card[]>;

export function buildCardPool(cards: Card[]): CardPool {
  const pool: CardPool = { common: [], uncommon: [], rare: [], mythic: [] };
  for (const card of cards) {
    if (!card.boosterEligible) continue;
    pool[card.rarity].push(card);
  }
  return pool;
}

function pickOne(list: Card[], rng: RandomFn): Card {
  if (list.length === 0) {
    throw new Error("Não há cartas suficientes nessa raridade para sortear.");
  }
  return list[Math.floor(rng() * list.length)];
}

function drawWithoutReplacement(list: Card[], count: number, rng: RandomFn): Card[] {
  if (list.length < count) {
    throw new Error(
      `Pool insuficiente: precisa de ${count} cartas, mas só há ${list.length} disponíveis.`,
    );
  }
  const remaining = [...list];
  const result: Card[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(rng() * remaining.length);
    result.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return result;
}

function pickWildcard(pool: CardPool, rng: RandomFn, weights: Record<Rarity, number>): Card {
  const roll = rng();
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    cumulative += weight;
    if (roll < cumulative) return pickOne(pool[rarity], rng);
  }
  return pickOne(pool.common, rng);
}

/** Gera um único Play Booster (13 cartas não-terra: 7 comuns, 3 incomuns, 1 raro/mítico, 2 wildcards). */
export function generateBooster(pool: CardPool, rng: RandomFn): Card[] {
  const isMythic = rng() < MYTHIC_ODDS;
  const rareOrMythicSource = isMythic ? pool.mythic : pool.rare;
  const rareOrMythic = pickOne(rareOrMythicSource, rng);

  const uncommons = drawWithoutReplacement(pool.uncommon, CARDS_PER_BOOSTER.uncommon, rng);
  const commons = drawWithoutReplacement(
    pool.common,
    CARDS_PER_BOOSTER.commonMain + CARDS_PER_BOOSTER.commonSeventh,
    rng,
  );
  const wildcardNonFoil = pickWildcard(pool, rng, WILDCARD_NONFOIL_WEIGHTS);
  const wildcardFoil = pickWildcard(pool, rng, WILDCARD_FOIL_WEIGHTS);

  return [rareOrMythic, ...uncommons, ...commons, wildcardNonFoil, wildcardFoil];
}
