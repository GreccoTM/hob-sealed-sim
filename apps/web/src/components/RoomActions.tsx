import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../lib/api.js";

interface RoomActionsProps {
  deckId: string;
}

export function RoomActions({ deckId }: RoomActionsProps) {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const { roomCode, token } = await createRoom(deckId);
      localStorage.setItem(`room-token-${roomCode}`, token);
      navigate(`/match/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const code = joinCode.trim().toUpperCase();
      const { roomCode, token } = await joinRoom(code, deckId);
      localStorage.setItem(`room-token-${roomCode}`, token);
      navigate(`/match/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="room-actions">
      <h3>Jogar</h3>
      <button disabled={loading} onClick={handleCreate}>
        Criar sala
      </button>
      <div className="room-join">
        <input
          placeholder="Código da sala"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value)}
        />
        <button disabled={loading} onClick={handleJoin}>
          Entrar
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
