import type { ZoneCardRef } from "@hob/shared";

interface ZoneStackProps {
  library: number;
  graveyard: ZoneCardRef[];
  exile: ZoneCardRef[];
  onViewGraveyard: () => void;
  onViewExile: () => void;
}

export function ZoneStack({ library, graveyard, exile, onViewGraveyard, onViewExile }: ZoneStackProps) {
  return (
    <div className="zone-stack">
      <div className="zone-tile zone-library" title="Biblioteca (oculta)">
        <div className="zone-tile-back" />
        <span className="zone-tile-count">{library}</span>
        <span className="zone-tile-label">Biblioteca</span>
      </div>
      <button className="zone-tile zone-graveyard" onClick={onViewGraveyard} disabled={graveyard.length === 0}>
        <div className="zone-tile-back zone-tile-back-graveyard" />
        <span className="zone-tile-count">{graveyard.length}</span>
        <span className="zone-tile-label">Cemitério</span>
      </button>
      <button className="zone-tile zone-exile" onClick={onViewExile} disabled={exile.length === 0}>
        <div className="zone-tile-back zone-tile-back-exile" />
        <span className="zone-tile-count">{exile.length}</span>
        <span className="zone-tile-label">Exílio</span>
      </button>
    </div>
  );
}
