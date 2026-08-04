import type { BattlefieldCard, Zone } from "@hob/shared";
import { getCard } from "../../lib/cards.js";
import { CardImage } from "../CardImage.js";

interface CardOnBattlefieldProps {
  card: BattlefieldCard;
  isMine: boolean;
  onTap: () => void;
  onMove: (zone: Zone) => void;
  onCounter: (counterType: string, delta: number) => void;
}

export function CardOnBattlefield({ card, isMine, onTap, onMove, onCounter }: CardOnBattlefieldProps) {
  const data = card.cardId ? getCard(card.cardId) : null;
  const counterEntries = Object.entries(card.counters).filter(([, value]) => value !== 0);

  return (
    <div className={`battlefield-card${card.tapped ? " tapped" : ""}${data ? ` rarity-${data.rarity}` : ""}`}>
      {data ? (
        <CardImage src={data.image.normalUrl} alt={data.name} onClick={onTap} title={data.name} />
      ) : (
        <div className="card-back" onClick={onTap} title="Carta virada para baixo" />
      )}
      {counterEntries.length > 0 && (
        <div className="counters">
          {counterEntries.map(([type, value]) => (
            <span key={type}>
              {type}: {value}
            </span>
          ))}
        </div>
      )}
      {isMine && (
        <div className="battlefield-card-controls">
          <button onClick={() => onCounter("+1/+1", 1)}>+1/+1</button>
          <button onClick={() => onCounter("+1/+1", -1)}>-1/+1</button>
          <button onClick={() => onMove("graveyard")}>Cemitério</button>
          <button onClick={() => onMove("exile")}>Exílio</button>
          <button onClick={() => onMove("hand")}>Mão</button>
        </div>
      )}
    </div>
  );
}
