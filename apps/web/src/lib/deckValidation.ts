import type { SealedPoolEntry } from "@hob/shared";
import { getCard } from "./cards.js";

export const MIN_DECK_SIZE = 40;

export interface DeckValidation {
  totalCards: number;
  minRequired: number;
  isValid: boolean;
  overLimitCardIds: string[];
}

/** Terras básicas são ilimitadas; as demais cartas não podem exceder o que saiu no pool. */
export function validateDeck(deck: Map<string, number>, pool: SealedPoolEntry[]): DeckValidation {
  const poolCounts = new Map(pool.map((entry) => [entry.cardId, entry.count]));
  let totalCards = 0;
  const overLimitCardIds: string[] = [];

  for (const [cardId, count] of deck) {
    totalCards += count;
    const card = getCard(cardId);
    if (card.isBasicLand) continue;
    const available = poolCounts.get(cardId) ?? 0;
    if (count > available) overLimitCardIds.push(cardId);
  }

  return {
    totalCards,
    minRequired: MIN_DECK_SIZE,
    isValid: totalCards >= MIN_DECK_SIZE && overLimitCardIds.length === 0,
    overLimitCardIds,
  };
}
