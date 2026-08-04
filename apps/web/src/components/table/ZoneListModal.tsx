import type { ZoneCardRef } from "@hob/shared";
import { getCard } from "../../lib/cards.js";
import { CardImage } from "../CardImage.js";

interface ZoneListModalProps {
  title: string;
  cards: ZoneCardRef[];
  onClose: () => void;
}

export function ZoneListModal({ title, cards, onClose }: ZoneListModalProps) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="zone-list-modal" onClick={(event) => event.stopPropagation()}>
        <h3>
          {title} ({cards.length})
        </h3>
        <div className="zone-list-grid">
          {cards.map(({ instanceId, cardId }) => {
            const card = getCard(cardId);
            return <CardImage key={instanceId} src={card.image.normalUrl} alt={card.name} title={card.name} />;
          })}
        </div>
        <button onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
