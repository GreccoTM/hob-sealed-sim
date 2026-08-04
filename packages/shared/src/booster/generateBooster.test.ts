import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Card } from "../types/card.js";
import { buildCardPool, generateBooster } from "./generateBooster.js";
import { generateSealedPool } from "./generateSealedPool.js";
import { seededRandom } from "./rng.js";
import { CARDS_PER_BOOSTER, MYTHIC_ODDS } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cards: Card[] = JSON.parse(
  readFileSync(path.join(__dirname, "../../data/cards.json"), "utf-8"),
);
const pool = buildCardPool(cards);

const ITERATIONS = 10_000;
const TOTAL_COMMONS = CARDS_PER_BOOSTER.commonMain + CARDS_PER_BOOSTER.commonSeventh;
const CARDS_PER_BOOSTER_TOTAL =
  1 + CARDS_PER_BOOSTER.uncommon + TOTAL_COMMONS + CARDS_PER_BOOSTER.wildcardNonFoil + CARDS_PER_BOOSTER.wildcardFoil;
const BOOSTERS_PER_SEALED_CHECK = 6 * CARDS_PER_BOOSTER_TOTAL;

describe("generateBooster", () => {
  it(`sempre gera ${CARDS_PER_BOOSTER_TOTAL} cartas (estrutura oficial do Play Booster, sem terra/anúncio)`, () => {
    const rng = seededRandom(1);
    const booster = generateBooster(pool, rng);
    expect(booster).toHaveLength(CARDS_PER_BOOSTER_TOTAL);
  });

  it("nunca repete carta dentro dos slots sem reposição (comuns e incomuns fixos)", () => {
    // Nota: os slots de wildcard SÃO sorteados com reposição por design (podem
    // repetir uma carta já sorteada no mesmo booster) — por isso a checagem de
    // unicidade usa os índices dos slots fixos, não o booster inteiro.
    const rng = seededRandom(42);
    for (let i = 0; i < 500; i++) {
      const booster = generateBooster(pool, rng);
      const uncommons = booster.slice(1, 1 + CARDS_PER_BOOSTER.uncommon);
      const commons = booster.slice(1 + CARDS_PER_BOOSTER.uncommon, 1 + CARDS_PER_BOOSTER.uncommon + TOTAL_COMMONS);
      expect(new Set(commons.map((c) => c.id)).size).toBe(commons.length);
      expect(new Set(uncommons.map((c) => c.id)).size).toBe(uncommons.length);
    }
  });

  it("respeita a contagem oficial de slots (1 raro/mítico, 3 incomuns, 7 comuns, 2 wildcards)", () => {
    const rng = seededRandom(7);
    const booster = generateBooster(pool, rng);
    const rareOrMythicSlot = booster.slice(0, 1);
    expect(rareOrMythicSlot.every((c) => c.rarity === "rare" || c.rarity === "mythic")).toBe(true);

    const uncommonSlots = booster.slice(1, 1 + CARDS_PER_BOOSTER.uncommon);
    expect(uncommonSlots).toHaveLength(CARDS_PER_BOOSTER.uncommon);

    const commonSlots = booster.slice(1 + CARDS_PER_BOOSTER.uncommon, 1 + CARDS_PER_BOOSTER.uncommon + TOTAL_COMMONS);
    expect(commonSlots).toHaveLength(TOTAL_COMMONS);

    const wildcardSlots = booster.slice(1 + CARDS_PER_BOOSTER.uncommon + TOTAL_COMMONS);
    expect(wildcardSlots).toHaveLength(CARDS_PER_BOOSTER.wildcardNonFoil + CARDS_PER_BOOSTER.wildcardFoil);
  });

  it("odds de mítico no slot raro/mítico ficam próximas de 1/7 (oficial) em 10k amostras", () => {
    const rng = seededRandom(1234);
    let mythicCount = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const booster = generateBooster(pool, rng);
      if (booster[0].rarity === "mythic") mythicCount++;
    }
    const observedRate = mythicCount / ITERATIONS;
    expect(observedRate).toBeGreaterThan(MYTHIC_ODDS - 0.02);
    expect(observedRate).toBeLessThan(MYTHIC_ODDS + 0.02);
  });

  it("distribuição de raridade no total do booster é plausível (comuns dominam)", () => {
    const rng = seededRandom(99);
    const rarityCounts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
    const samples = 2000;
    for (let i = 0; i < samples; i++) {
      const booster = generateBooster(pool, rng);
      for (const card of booster) rarityCounts[card.rarity]++;
    }
    // comuns devem ser a fatia dominante (7 dos 13 slots + boa parte dos wildcards)
    expect(rarityCounts.common).toBeGreaterThan(rarityCounts.uncommon);
    expect(rarityCounts.uncommon).toBeGreaterThan(rarityCounts.rare);
    expect(rarityCounts.rare).toBeGreaterThan(rarityCounts.mythic);
  });
});

describe("generateSealedPool", () => {
  it(`gera ${BOOSTERS_PER_SEALED_CHECK} cartas (6 boosters x ${CARDS_PER_BOOSTER_TOTAL}) por pool sealed`, () => {
    const rng = seededRandom(55);
    const entries = generateSealedPool(cards, rng);
    const total = entries.reduce((sum, e) => sum + e.count, 0);
    expect(total).toBe(BOOSTERS_PER_SEALED_CHECK);
  });

  it("é determinístico para o mesmo seed", () => {
    const poolA = generateSealedPool(cards, seededRandom(777));
    const poolB = generateSealedPool(cards, seededRandom(777));
    expect(poolA).toEqual(poolB);
  });
});
