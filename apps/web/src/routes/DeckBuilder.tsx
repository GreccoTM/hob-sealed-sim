import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePool } from "../state/PoolContext.js";
import { getCard } from "../lib/cards.js";
import type { GroupMode } from "../lib/cardGrouping.js";
import { PoolGrid } from "../components/PoolGrid.js";
import { GroupBySelector } from "../components/GroupBySelector.js";
import { DeckList } from "../components/DeckList.js";
import { BasicLandsPanel } from "../components/BasicLandsPanel.js";
import { CardModal } from "../components/CardModal.js";

export function DeckBuilder() {
  const { poolId, pool, deck, setDeck } = usePool();
  const [zoomCardId, setZoomCardId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupMode>("rarity");
  const navigate = useNavigate();

  useEffect(() => {
    if (!pool || !poolId) navigate("/");
  }, [pool, poolId, navigate]);

  if (!pool || !poolId) return null;

  function updateDeck(cardId: string, delta: number) {
    setDeck((prev) => {
      const next = new Map(prev);
      const updated = (next.get(cardId) ?? 0) + delta;
      if (updated <= 0) next.delete(cardId);
      else next.set(cardId, updated);
      return next;
    });
  }

  return (
    <div className="deck-builder">
      <div className="deck-builder-main">
        <GroupBySelector value={groupBy} onChange={setGroupBy} />
        <PoolGrid
          pool={pool}
          deck={deck}
          groupBy={groupBy}
          onAdd={(id) => updateDeck(id, 1)}
          onRemove={(id) => updateDeck(id, -1)}
          onZoom={setZoomCardId}
        />
        <BasicLandsPanel deck={deck} onAdd={(id) => updateDeck(id, 1)} onRemove={(id) => updateDeck(id, -1)} />
      </div>
      <aside className="deck-builder-sidebar">
        <DeckList poolId={poolId} deck={deck} pool={pool} onRemove={(id) => updateDeck(id, -1)} />
      </aside>
      {zoomCardId && <CardModal card={getCard(zoomCardId)} onClose={() => setZoomCardId(null)} />}
    </div>
  );
}
