export type Rarity = "common" | "uncommon" | "rare" | "mythic";

export type Layout = "normal" | "adventure" | "saga";

export interface CardFace {
  name: string;
  manaCost: string | null;
  typeLine: string;
  oracleText: string | null;
  power: string | null;
  toughness: string | null;
}

export interface CardImage {
  normalUrl: string;
  largeUrl: string;
}

export interface Card {
  id: string;
  name: string;
  layout: Layout;
  manaCost: string | null;
  cmc: number;
  typeLine: string;
  oracleText: string | null;
  power: string | null;
  toughness: string | null;
  colors: string[];
  colorIdentity: string[];
  rarity: Rarity;
  collectorNumber: string;
  faces: CardFace[] | null;
  isBasicLand: boolean;
  isNonbasicLand: boolean;
  boosterEligible: boolean;
  image: CardImage;
}
