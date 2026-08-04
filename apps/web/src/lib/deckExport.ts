import { getCard } from "./cards.js";

const SET_CODE = "HOB";

function sortedEntries(deck: Map<string, number>): [string, number][] {
  return [...deck].sort((a, b) => getCard(a[0]).name.localeCompare(getCard(b[0]).name));
}

export function exportPlainText(deck: Map<string, number>, sideboard: Map<string, number>): string {
  const lines: string[] = ["Deck"];
  for (const [id, count] of sortedEntries(deck)) {
    lines.push(`${count} ${getCard(id).name}`);
  }
  if (sideboard.size > 0) {
    lines.push("", "Sideboard");
    for (const [id, count] of sortedEntries(sideboard)) {
      lines.push(`${count} ${getCard(id).name}`);
    }
  }
  return lines.join("\n");
}

/** Formato de importação Arena/MTGO: "<qtd> <Nome> (SET) <collector_number>". */
export function exportArena(deck: Map<string, number>, sideboard: Map<string, number>): string {
  const format = ([id, count]: [string, number]) => {
    const card = getCard(id);
    return `${count} ${card.name} (${SET_CODE}) ${card.collectorNumber}`;
  };
  const lines = sortedEntries(deck).map(format);
  if (sideboard.size > 0) {
    lines.push("", "Sideboard", ...sortedEntries(sideboard).map(format));
  }
  return lines.join("\n");
}
