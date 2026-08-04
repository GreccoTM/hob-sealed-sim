import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SealedPoolEntry } from "@hob/shared";
import { getCard } from "../lib/cards.js";
import { validateDeck } from "../lib/deckValidation.js";
import { exportArena, exportPlainText } from "../lib/deckExport.js";
import { saveDeck } from "../lib/api.js";
import { RoomActions } from "./RoomActions.js";
import { ManaCurveChart } from "./ManaCurveChart.js";
import { ColorPieChart } from "./ColorPieChart.js";
import { getColorPips, getManaCurve } from "../lib/deckStats.js";

interface DeckListProps {
  poolId: string;
  deck: Map<string, number>;
  pool: SealedPoolEntry[];
  onRemove: (cardId: string) => void;
}

function toEntries(map: Map<string, number>): SealedPoolEntry[] {
  return [...map.entries()].map(([cardId, count]) => ({ cardId, count }));
}

export function DeckList({ poolId, deck, pool, onRemove }: DeckListProps) {
  const navigate = useNavigate();
  const validation = useMemo(() => validateDeck(deck, pool), [deck, pool]);
  const [exportedText, setExportedText] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);

  const manaCurve = useMemo(() => getManaCurve(deck), [deck]);
  const colorPips = useMemo(() => getColorPips(deck), [deck]);

  const sideboard = useMemo(() => {
    const sb = new Map<string, number>();
    for (const entry of pool) {
      const used = deck.get(entry.cardId) ?? 0;
      const left = entry.count - used;
      if (left > 0) sb.set(entry.cardId, left);
    }
    return sb;
  }, [deck, pool]);

  function handleExport(format: "text" | "arena") {
    const text = format === "text" ? exportPlainText(deck, sideboard) : exportArena(deck, sideboard);
    navigator.clipboard?.writeText(text).catch(() => {});
    setExportedText(text);
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const { id } = await saveDeck({ poolId, maindeck: toEntries(deck), sideboard: toEntries(sideboard) });
      setSavedDeckId(id);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const entries = [...deck.entries()].sort((a, b) => getCard(a[0]).name.localeCompare(getCard(b[0]).name));

  return (
    <div className="deck-list">
      <h2>
        Deck ({validation.totalCards} / mín. {validation.minRequired})
      </h2>
      {validation.totalCards < validation.minRequired && (
        <p className="deck-warning">
          Faltam {validation.minRequired - validation.totalCards} cartas para um deck válido.
        </p>
      )}
      <button
        className="practice-button"
        disabled={validation.totalCards === 0}
        onClick={() => navigate("/practice")}
      >
        Testar deck sozinho (goldfish)
      </button>
      <ManaCurveChart data={manaCurve} />
      <ColorPieChart data={colorPips} />
      <ul>
        {entries.map(([id, count]) => (
          <li key={id}>
            <button onClick={() => onRemove(id)}>-</button>
            {count}x {getCard(id).name}
          </li>
        ))}
      </ul>
      <div className="deck-export">
        <button disabled={!validation.isValid} onClick={() => handleExport("text")}>
          Exportar (texto)
        </button>
        <button disabled={!validation.isValid} onClick={() => handleExport("arena")}>
          Exportar (Arena/MTGO)
        </button>
        <button disabled={!validation.isValid || saveState === "saving"} onClick={handleSave}>
          {saveState === "saving" ? "Salvando..." : saveState === "saved" ? "Salvo ✓" : "Salvar deck"}
        </button>
        {saveState === "error" && <p className="error">Falha ao salvar o deck.</p>}
      </div>
      {exportedText && (
        <div className="deck-export-output">
          <p>Copiado para a área de transferência:</p>
          <textarea readOnly value={exportedText} rows={10} />
          <button onClick={() => setExportedText(null)}>Fechar</button>
        </div>
      )}
      {savedDeckId && <RoomActions deckId={savedDeckId} />}
    </div>
  );
}
