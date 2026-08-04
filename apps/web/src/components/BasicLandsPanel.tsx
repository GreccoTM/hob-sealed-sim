import { cards } from "../lib/cards.js";
import { CardImage } from "./CardImage.js";

interface BasicLandsPanelProps {
  deck: Map<string, number>;
  onAdd: (cardId: string) => void;
  onRemove: (cardId: string) => void;
}

export function BasicLandsPanel({ deck, onAdd, onRemove }: BasicLandsPanelProps) {
  const basics = cards.filter((card) => card.isBasicLand);

  return (
    <div className="basic-lands-panel">
      <h3>Terras básicas (ilimitadas)</h3>
      <div className="card-tile-row">
        {basics.map((card) => (
          <div key={card.id} className="basic-land-tile">
            <CardImage src={card.image.normalUrl} alt={card.name} />
            <span>{card.name}</span>
            <div className="card-tile-controls">
              <button onClick={() => onRemove(card.id)} disabled={(deck.get(card.id) ?? 0) === 0}>
                -
              </button>
              <span>{deck.get(card.id) ?? 0}</span>
              <button onClick={() => onAdd(card.id)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
