import type { Card } from "@hob/shared";
import cardsJson from "../../../../packages/shared/data/cards.json" with { type: "json" };

export const cards = cardsJson as Card[];
