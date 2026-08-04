interface LifeCounterProps {
  life: number;
  editable: boolean;
  onChange?: (delta: number) => void;
}

export function LifeCounter({ life, editable, onChange }: LifeCounterProps) {
  return (
    <span className="life-counter">
      {editable && <button onClick={() => onChange?.(-1)}>-</button>}
      <strong>{life}</strong>
      {editable && <button onClick={() => onChange?.(1)}>+</button>}
    </span>
  );
}
