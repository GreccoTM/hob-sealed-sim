import type { ClientAction } from "@hob/shared";

interface DeckLibraryControlsProps {
  send: (action: ClientAction) => void;
}

export function DeckLibraryControls({ send }: DeckLibraryControlsProps) {
  return (
    <div className="deck-library-controls">
      <button onClick={() => send({ type: "DRAW_CARD", count: 1 })}>Comprar</button>
      <button onClick={() => send({ type: "SHUFFLE_LIBRARY" })}>Embaralhar</button>
      <button onClick={() => send({ type: "MULLIGAN" })}>Mulligan</button>
      <button onClick={() => send({ type: "CONCEDE" })}>Desistir</button>
    </div>
  );
}
