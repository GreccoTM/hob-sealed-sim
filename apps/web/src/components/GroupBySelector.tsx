import type { GroupMode } from "../lib/cardGrouping.js";

interface GroupBySelectorProps {
  value: GroupMode;
  onChange: (mode: GroupMode) => void;
}

const OPTIONS: { mode: GroupMode; label: string }[] = [
  { mode: "rarity", label: "Raridade" },
  { mode: "color", label: "Cor" },
  { mode: "type", label: "Tipo" },
];

export function GroupBySelector({ value, onChange }: GroupBySelectorProps) {
  return (
    <div className="group-by-selector">
      <span>Agrupar por:</span>
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          className={option.mode === value ? "active" : ""}
          onClick={() => onChange(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
