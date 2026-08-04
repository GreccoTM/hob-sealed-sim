import type { Rarity } from "../types/card.js";

export const BOOSTERS_PER_SEALED = 6;

/**
 * Estrutura oficial do Play Booster (Wizards of the Coast, formato adotado a
 * partir de Murders at Karlov Manor em 2024): 6 comuns (slots 1-6) + 1 comum
 * do "slot 7" (que em sets oficiais às vezes vem de The List — sem pool de
 * reimpressão equivalente aqui, então é sempre comum) + 3 incomuns + 1 slot
 * de raro/mítico + 2 wildcards (não-foil e foil, com pesos diferentes entre
 * si). O slot de terra básica e o slot de anúncio/token não entram aqui: são
 * irrelevantes pro pool (terras básicas já são ilimitadas na hora de montar
 * o deck) ou não são cartas jogáveis.
 */
export const CARDS_PER_BOOSTER = {
  commonMain: 6,
  commonSeventh: 1,
  uncommon: 3,
  rareOrMythic: 1,
  wildcardNonFoil: 1,
  wildcardFoil: 1,
} as const;

/** Odds oficiais do slot principal de raro/mítico: ~1 em 7 (fold do borderless na raridade base). */
export const MYTHIC_ODDS = 1 / 7;

/** Pesos oficiais do wildcard não-foil (fact sheets de colação recentes; revved-up dobrado nas raridades base). */
export const WILDCARD_NONFOIL_WEIGHTS: Record<Rarity, number> = {
  common: 0.093,
  uncommon: 0.698,
  rare: 0.179,
  mythic: 0.03,
};

/** Pesos oficiais do wildcard foil — favorece muito mais comuns que o não-foil. */
export const WILDCARD_FOIL_WEIGHTS: Record<Rarity, number> = {
  common: 0.61,
  uncommon: 0.305,
  rare: 0.073,
  mythic: 0.012,
};
