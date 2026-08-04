import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { SealedPoolEntry } from "@hob/shared";
import { usePool } from "../state/PoolContext.js";
import { usePracticeGame, SOLO_PLAYER_ID } from "../hooks/usePracticeGame.js";
import { Battlefield } from "../components/table/Battlefield.js";
import { Hand } from "../components/table/Hand.js";
import { LifeCounter } from "../components/table/LifeCounter.js";
import { DeckLibraryControls } from "../components/table/DeckLibraryControls.js";

export function Practice() {
  const { pool, deck } = usePool();
  const navigate = useNavigate();

  const maindeck: SealedPoolEntry[] = useMemo(
    () => [...deck.entries()].map(([cardId, count]) => ({ cardId, count })),
    [deck],
  );

  useEffect(() => {
    if (!pool || maindeck.length === 0) navigate("/deck");
  }, [pool, maindeck, navigate]);

  const { state, send, reset } = usePracticeGame(maindeck);

  if (!pool || maindeck.length === 0) return null;

  const me = state.players[0];

  return (
    <div className="match-board">
      <div className="match-header">
        <div>
          <button onClick={() => navigate("/deck")}>← Voltar pro deck</button>
          <strong style={{ marginLeft: "0.75rem" }}>Modo solo (goldfish)</strong>
        </div>
        <div>
          <LifeCounter life={me.life} editable onChange={(delta) => send({ type: "SET_LIFE", delta })} />
          <button onClick={reset}>Reiniciar mão</button>
        </div>
      </div>
      <Battlefield battlefield={state.battlefield} me={me} myId={SOLO_PLAYER_ID} send={send} soloMode />
      <DeckLibraryControls send={send} />
      {me.hand && <Hand hand={me.hand} send={send} />}
    </div>
  );
}
