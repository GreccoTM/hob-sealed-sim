import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/authContext.js";
import { useGameSocket } from "../hooks/useGameSocket.js";
import { Battlefield } from "../components/table/Battlefield.js";
import { Hand } from "../components/table/Hand.js";
import { LifeCounter } from "../components/table/LifeCounter.js";
import { DeckLibraryControls } from "../components/table/DeckLibraryControls.js";
import { ReconnectBanner } from "../components/table/ReconnectBanner.js";

export function Match() {
  const { code } = useParams<{ code: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const stored = localStorage.getItem(`room-token-${code}`);
    if (!stored) {
      navigate("/");
      return;
    }
    setToken(stored);
  }, [code, navigate]);

  if (!code || !token || !session) return null;

  return <MatchBoard roomCode={code} token={token} myId={session.user.id} />;
}

function MatchBoard({ roomCode, token, myId }: { roomCode: string; token: string; myId: string }) {
  const { state, status, send } = useGameSocket(roomCode, token);

  if (!state) return <p>Conectando à sala {roomCode}...</p>;

  if (state.status === "waiting") {
    return (
      <div className="match-waiting">
        <h1>Sala {roomCode}</h1>
        <p>
          Aguardando o segundo jogador entrar com o código <strong>{roomCode}</strong>...
        </p>
      </div>
    );
  }

  const me = state.players.find((p) => p.userId === myId);
  const opponent = state.players.find((p) => p.userId !== myId);
  if (!me || !opponent) return null;

  return (
    <div className="match-board">
      <ReconnectBanner status={status} opponentConnected={opponent.connected} />
      <div className="match-header">
        <div>
          <strong>{opponent.displayName}</strong> <LifeCounter life={opponent.life} editable={false} /> Mão:{" "}
          {opponent.handCount}
        </div>
        <div>
          <strong>{me.displayName} (você)</strong>{" "}
          <LifeCounter life={me.life} editable onChange={(delta) => send({ type: "SET_LIFE", delta })} />
        </div>
      </div>
      <Battlefield battlefield={state.battlefield} me={me} opponent={opponent} myId={myId} send={send} />
      <DeckLibraryControls send={send} />
      {me.hand && <Hand hand={me.hand} send={send} />}
    </div>
  );
}
