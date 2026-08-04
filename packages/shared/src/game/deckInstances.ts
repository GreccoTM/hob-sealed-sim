import type { SealedPoolEntry } from "../booster/generateSealedPool.js";

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Expande {cardId,count}[] em instanceIds únicos, preenchendo cardIndex (instanceId -> cardId). */
export function expandDeckToInstances(
  maindeck: SealedPoolEntry[],
  cardIndex: Record<string, string>,
  startSeq: number,
): { instanceIds: string[]; nextSeq: number } {
  const instanceIds: string[] = [];
  let seq = startSeq;
  for (const entry of maindeck) {
    for (let i = 0; i < entry.count; i++) {
      const instanceId = `c${seq++}`;
      cardIndex[instanceId] = entry.cardId;
      instanceIds.push(instanceId);
    }
  }
  return { instanceIds, nextSeq: seq };
}
