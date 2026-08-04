import type { ColorSymbol } from "./deckStats.js";

/**
 * Paleta validada com o validador de daltonismo da skill de dataviz para a
 * ordem fixa COLOR_PIP_DISPLAY_ORDER (U,G,R,B,W) — ALL CHECKS PASS no modo
 * dark (worst adjacent CVD ΔE 6.5 protan — dentro da faixa aceitável com
 * rótulo direto, que já usamos na legenda). Não mexer na ordem sem revalidar.
 */
export const PIP_COLOR_HEX: Record<ColorSymbol, string> = {
  U: "#3987e5",
  G: "#199e70",
  R: "#e66767",
  B: "#9085e9",
  W: "#c98500",
};
