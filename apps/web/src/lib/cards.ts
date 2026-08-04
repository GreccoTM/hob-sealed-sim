import type { Card } from "@hob/shared";
import cardsJson from "../../../../packages/shared/data/cards.json";

export const cards: Card[] = cardsJson as Card[];

export const cardsById: Map<string, Card> = new Map(cards.map((card) => [card.id, card]));

export function getCard(id: string): Card {
  const card = cardsById.get(id);
  if (!card) throw new Error(`Carta desconhecida: ${id}`);
  return card;
}
