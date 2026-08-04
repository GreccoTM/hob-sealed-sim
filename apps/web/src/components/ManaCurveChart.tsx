import type { ManaCurveBucket } from "../lib/deckStats.js";

interface ManaCurveChartProps {
  data: ManaCurveBucket[];
}

export function ManaCurveChart({ data }: ManaCurveChartProps) {
  const max = Math.max(1, ...data.map((bucket) => bucket.count));

  return (
    <div className="mana-curve-chart">
      <h3>Curva de mana</h3>
      <div className="mana-curve-bars" role="img" aria-label="Curva de mana do deck por custo de mana convertido">
        {data.map((bucket) => (
          <div key={bucket.label} className="mana-curve-col">
            <span className="mana-curve-value">{bucket.count > 0 ? bucket.count : ""}</span>
            <div className="mana-curve-track">
              <div className="mana-curve-bar" style={{ height: `${(bucket.count / max) * 100}%` }} />
            </div>
            <span className="mana-curve-label">{bucket.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
