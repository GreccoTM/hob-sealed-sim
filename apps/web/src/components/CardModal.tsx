import type { Card } from "@hob/shared";
import { CardImage } from "./CardImage.js";

interface CardModalProps {
  card: Card;
  onClose: () => void;
}

export function CardModal({ card, onClose }: CardModalProps) {
  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div className="card-modal" onClick={(event) => event.stopPropagation()}>
        <CardImage src={card.image.largeUrl} alt={card.name} />
        <div className="card-modal-text">
          <h3>{card.name}</h3>
          <p className="type-line">{card.typeLine}</p>
          {card.faces ? (
            card.faces.map((face) => (
              <div key={face.name}>
                <strong>
                  {face.name} {face.manaCost}
                </strong>
                <p>{face.oracleText}</p>
              </div>
            ))
          ) : (
            <p>{card.oracleText}</p>
          )}
        </div>
        <button onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
