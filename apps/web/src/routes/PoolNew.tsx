import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { openSealedPool } from "../lib/api.js";
import { usePool } from "../state/PoolContext.js";

export function PoolNew() {
  const { setPoolId, setPool, setDeck } = usePool();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleOpen() {
    setLoading(true);
    setError(null);
    try {
      const { id, pool } = await openSealedPool();
      setPoolId(id);
      setPool(pool);
      setDeck(new Map());
      navigate("/deck");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pool-new">
      <h1>Sealed Deck — The Hobbit</h1>
      <p>Abra 6 boosters e monte seu deck (mínimo 40 cartas, terras básicas ilimitadas).</p>
      <button onClick={handleOpen} disabled={loading}>
        {loading ? "Abrindo..." : "Abrir 6 boosters"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
