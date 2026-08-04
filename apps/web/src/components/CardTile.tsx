import type { Card } from "@hob/shared";
import { CardImage } from "./CardImage.js";

interface CardTileProps {
  card: Card;
  countInPool: number;
  countInDeck: number;
  onAdd: () => void;
  onRemove: () => void;
  onZoom: () => void;
}

export function CardTile({ card, countInPool, countInDeck, onAdd, onRemove, onZoom }: CardTileProps) {
  const remaining = countInPool - countInDeck;
  return (
    <div className={`card-tile rarity-${card.rarity}`}>
      <CardImage src={card.image.largeUrl} alt={card.name} onClick={onZoom} />
      <div className="card-tile-info">
        <span className="card-name">{card.name}</span>
      </div>
      <div className="card-tile-controls">
        <button onClick={onRemove} disabled={countInDeck === 0}>
          -
        </button>
        <span>
          {countInDeck}/{countInPool}
        </span>
        <button onClick={onAdd} disabled={remaining <= 0}>
          +
        </button>
      </div>
    </div>
  );
}
