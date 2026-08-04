import type { Card, Rarity, SealedPoolEntry } from "@hob/shared";
import { getCard } from "../lib/cards.js";
import { CardTile } from "./CardTile.js";
import {
  COLOR_GROUP_ORDER,
  TYPE_GROUP_ORDER,
  colorGroupKey,
  colorGroupLabel,
  typeGroupKey,
  typeGroupLabel,
  type GroupMode,
} from "../lib/cardGrouping.js";

interface PoolGridProps {
  pool: SealedPoolEntry[];
  deck: Map<string, number>;
  groupBy: GroupMode;
  onAdd: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  onZoom: (cardId: string) => void;
}

const RARITY_ORDER: Rarity[] = ["mythic", "rare", "uncommon", "common"];
const RARITY_LABEL: Record<Rarity, string> = {
  mythic: "Míticas",
  rare: "Raras",
  uncommon: "Incomuns",
  common: "Comuns",
};

interface Grouping {
  order: string[];
  keyFor: (card: Card) => string;
  labelFor: (key: string) => string;
  sectionClass: (key: string) => string;
}

function groupingFor(mode: GroupMode): Grouping {
  if (mode === "color") {
    return {
      order: COLOR_GROUP_ORDER,
      keyFor: colorGroupKey,
      labelFor: colorGroupLabel,
      sectionClass: (key) => `color-${key}`,
    };
  }
  if (mode === "type") {
    return {
      order: TYPE_GROUP_ORDER,
      keyFor: typeGroupKey,
      labelFor: typeGroupLabel,
      sectionClass: () => "",
    };
  }
  return {
    order: RARITY_ORDER,
    keyFor: (card) => card.rarity,
    labelFor: (key) => RARITY_LABEL[key as Rarity],
    sectionClass: (key) => `rarity-${key}`,
  };
}

export function PoolGrid({ pool, deck, groupBy, onAdd, onRemove, onZoom }: PoolGridProps) {
  const { order, keyFor, labelFor, sectionClass } = groupingFor(groupBy);

  return (
    <div className="pool-grid">
      {order.map((key) => {
        const entries = pool
          .filter((entry) => keyFor(getCard(entry.cardId)) === key)
          .sort((a, b) => getCard(a.cardId).name.localeCompare(getCard(b.cardId).name));
        if (entries.length === 0) return null;

        return (
          <section key={key} className={`pool-section ${sectionClass(key)}`}>
            <h3>{labelFor(key)}</h3>
            <div className="card-tile-row">
              {entries.map((entry) => (
                <CardTile
                  key={entry.cardId}
                  card={getCard(entry.cardId)}
                  countInPool={entry.count}
                  countInDeck={deck.get(entry.cardId) ?? 0}
                  onAdd={() => onAdd(entry.cardId)}
                  onRemove={() => onRemove(entry.cardId)}
                  onZoom={() => onZoom(entry.cardId)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
