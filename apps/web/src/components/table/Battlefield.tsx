import { useState } from "react";
import type { BattlefieldCard, ClientAction, PlayerView, Zone, ZoneCardRef } from "@hob/shared";
import { CardOnBattlefield } from "./CardOnBattlefield.js";
import { ZoneStack } from "./ZoneStack.js";
import { ZoneListModal } from "./ZoneListModal.js";
import { getCard } from "../../lib/cards.js";
import { typeGroupKey } from "../../lib/cardGrouping.js";

interface BattlefieldProps {
  battlefield: BattlefieldCard[];
  me: PlayerView;
  opponent?: PlayerView;
  myId: string;
  send: (action: ClientAction) => void;
  soloMode?: boolean;
}

// MTR 4.7 (Game Layout): terras ficam na borda mais próxima do jogador; não-terras
// ficam entre o jogador e o oponente. Aqui isso vira, de cima pra baixo na tela:
// terras do oponente -> não-terras do oponente -> não-terras minhas -> terras minhas.
function isLandCard(card: BattlefieldCard): boolean {
  if (!card.cardId) return false;
  return typeGroupKey(getCard(card.cardId)) === "Land";
}

type ZoneView = { owner: "me" | "opponent"; kind: "graveyard" | "exile" };

export function Battlefield({ battlefield, me, opponent, myId, send, soloMode }: BattlefieldProps) {
  const [viewingZone, setViewingZone] = useState<ZoneView | null>(null);

  const theirs = battlefield.filter((card) => card.controllerId !== myId);
  const mine = battlefield.filter((card) => card.controllerId === myId);
  const theirLands = theirs.filter(isLandCard);
  const theirNonlands = theirs.filter((card) => !isLandCard(card));
  const myLands = mine.filter(isLandCard);
  const myNonlands = mine.filter((card) => !isLandCard(card));

  function renderCard(card: BattlefieldCard, isMine: boolean) {
    return (
      <CardOnBattlefield
        key={card.instanceId}
        card={card}
        isMine={isMine}
        onTap={isMine ? () => send({ type: "TAP_TOGGLE", instanceId: card.instanceId }) : () => {}}
        onMove={isMine ? (toZone: Zone) => send({ type: "MOVE_CARD", instanceId: card.instanceId, toZone }) : () => {}}
        onCounter={
          isMine
            ? (counterType, delta) => send({ type: "ADD_COUNTER", instanceId: card.instanceId, counterType, delta })
            : () => {}
        }
      />
    );
  }

  const zoneOwner = viewingZone && (viewingZone.owner === "me" ? me : opponent);
  const activeZoneCards: ZoneCardRef[] = zoneOwner && viewingZone ? zoneOwner[viewingZone.kind] : [];

  return (
    <div className="battlefield">
      {!soloMode && opponent && (
        <>
          <div className="battlefield-row opponent-lands-row">
            {theirLands.map((card) => renderCard(card, false))}
            <ZoneStack
              library={opponent.libraryCount}
              graveyard={opponent.graveyard}
              exile={opponent.exile}
              onViewGraveyard={() => setViewingZone({ owner: "opponent", kind: "graveyard" })}
              onViewExile={() => setViewingZone({ owner: "opponent", kind: "exile" })}
            />
          </div>
          <div className="battlefield-row opponent-nonlands-row">
            {theirNonlands.map((card) => renderCard(card, false))}
          </div>
        </>
      )}
      <div className="battlefield-row my-nonlands-row">{myNonlands.map((card) => renderCard(card, true))}</div>
      <div className="battlefield-row my-lands-row">
        {myLands.map((card) => renderCard(card, true))}
        <ZoneStack
          library={me.libraryCount}
          graveyard={me.graveyard}
          exile={me.exile}
          onViewGraveyard={() => setViewingZone({ owner: "me", kind: "graveyard" })}
          onViewExile={() => setViewingZone({ owner: "me", kind: "exile" })}
        />
      </div>
      {viewingZone && (
        <ZoneListModal
          title={viewingZone.kind === "graveyard" ? "Cemitério" : "Exílio"}
          cards={activeZoneCards}
          onClose={() => setViewingZone(null)}
        />
      )}
    </div>
  );
}
