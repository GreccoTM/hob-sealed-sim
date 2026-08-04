import { getCard } from "./cards.js";

export interface ManaCurveBucket {
  label: string;
  count: number;
}

export function getManaCurve(deck: Map<string, number>): ManaCurveBucket[] {
  const buckets = new Map<number, number>();
  for (const [cardId, count] of deck) {
    const card = getCard(cardId);
    if (card.isBasicLand || card.isNonbasicLand) continue;
    const cmc = Math.min(Math.floor(card.cmc), 7);
    buckets.set(cmc, (buckets.get(cmc) ?? 0) + count);
  }
  return Array.from({ length: 8 }, (_, cmc) => ({
    label: cmc === 7 ? "7+" : String(cmc),
    count: buckets.get(cmc) ?? 0,
  }));
}

export type ColorSymbol = "W" | "U" | "B" | "R" | "G";

const COLOR_SYMBOLS: ColorSymbol[] = ["W", "U", "B", "R", "G"];

/** Ordem fixa validada contra confusão de daltonismo (ver skill de dataviz) — não é a ordem WUBRG convencional. */
export const COLOR_PIP_DISPLAY_ORDER: ColorSymbol[] = ["U", "G", "R", "B", "W"];

function countPips(manaCost: string | null): Partial<Record<ColorSymbol, number>> {
  const result: Partial<Record<ColorSymbol, number>> = {};
  if (!manaCost) return result;
  const symbols = manaCost.match(/\{([^}]+)\}/g) ?? [];
  for (const symbol of symbols) {
    const content = symbol.slice(1, -1);
    for (const color of COLOR_SYMBOLS) {
      if (content.includes(color)) {
        result[color] = (result[color] ?? 0) + 1;
      }
    }
  }
  return result;
}

export interface ColorPipCount {
  color: ColorSymbol;
  count: number;
}

/** Conta pips de mana coloridos no deck (soma as duas faces em cartas adventure) — usado pra estimar proporção de terras. */
export function getColorPips(deck: Map<string, number>): ColorPipCount[] {
  const totals: Record<ColorSymbol, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

  for (const [cardId, count] of deck) {
    const card = getCard(cardId);
    const costs = card.faces && card.faces.length > 0 ? card.faces.map((face) => face.manaCost) : [card.manaCost];
    for (const cost of costs) {
      const pips = countPips(cost);
      for (const color of COLOR_SYMBOLS) {
        totals[color] += (pips[color] ?? 0) * count;
      }
    }
  }

  return COLOR_PIP_DISPLAY_ORDER.map((color) => ({ color, count: totals[color] })).filter((entry) => entry.count > 0);
}
