import type { ClientAction, ZoneCardRef } from "@hob/shared";
import { getCard } from "../../lib/cards.js";
import { CardImage } from "../CardImage.js";

interface HandProps {
  hand: ZoneCardRef[];
  send: (action: ClientAction) => void;
}

export function Hand({ hand, send }: HandProps) {
  return (
    <div className="hand">
      {hand.map(({ instanceId, cardId }) => {
        const card = getCard(cardId);
        return (
          <div key={instanceId} className={`hand-card rarity-${card.rarity}`}>
            <CardImage src={card.image.largeUrl} alt={card.name} title={card.name} />
            <div className="hand-card-controls">
              <button onClick={() => send({ type: "MOVE_CARD", instanceId, toZone: "battlefield" })}>Jogar</button>
              <button onClick={() => send({ type: "MOVE_CARD", instanceId, toZone: "graveyard" })}>Descartar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
