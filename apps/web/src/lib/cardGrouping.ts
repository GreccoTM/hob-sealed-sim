import type { Card } from "@hob/shared";

export type GroupMode = "rarity" | "color" | "type";

export const COLOR_NAMES: Record<string, string> = {
  W: "Branco",
  U: "Azul",
  B: "Preto",
  R: "Vermelho",
  G: "Verde",
};

export const COLOR_GROUP_ORDER = ["W", "U", "B", "R", "G", "M", "C"];

export function colorGroupKey(card: Card): string {
  if (card.colors.length === 0) return "C";
  if (card.colors.length > 1) return "M";
  return card.colors[0];
}

export function colorGroupLabel(key: string): string {
  if (key === "C") return "Incolor";
  if (key === "M") return "Multicolor";
  return COLOR_NAMES[key] ?? key;
}

const TYPE_PRIORITY: [string, string][] = [
  ["Creature", "Criaturas"],
  ["Planeswalker", "Planeswalkers"],
  ["Battle", "Batalhas"],
  ["Land", "Terras"],
  ["Artifact", "Artefatos"],
  ["Enchantment", "Encantamentos"],
  ["Instant", "Mágicas Instantâneas"],
  ["Sorcery", "Feitiços"],
];

export const TYPE_GROUP_ORDER = [...TYPE_PRIORITY.map(([key]) => key), "Other"];

export function typeGroupKey(card: Card): string {
  const mainLine = card.typeLine.split("—")[0];
  for (const [keyword] of TYPE_PRIORITY) {
    if (mainLine.includes(keyword)) return keyword;
  }
  return "Other";
}

export function typeGroupLabel(key: string): string {
  const found = TYPE_PRIORITY.find(([k]) => k === key);
  return found ? found[1] : "Outros";
}
