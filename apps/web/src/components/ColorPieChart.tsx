import type { ColorPipCount } from "../lib/deckStats.js";
import { COLOR_NAMES } from "../lib/cardGrouping.js";
import { PIP_COLOR_HEX } from "../lib/colorPalette.js";

interface ColorPieChartProps {
  data: ColorPipCount[];
}

const SIZE = 130;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_PX = 3;

export function ColorPieChart({ data }: ColorPieChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="color-pie-chart">
      <h3>Pips de mana por cor</h3>
      {total === 0 ? (
        <p className="pie-empty">Adicione cartas coloridas ao deck para ver a proporção de mana.</p>
      ) : (
        <div className="pie-body">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Distribuição de pips de mana por cor">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--bg-well)" strokeWidth={STROKE} />
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {(() => {
                let offset = 0;
                return data.map((entry) => {
                  const length = (entry.count / total) * CIRCUMFERENCE;
                  const visible = Math.max(0, length - GAP_PX);
                  const el = (
                    <circle
                      key={entry.color}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={PIP_COLOR_HEX[entry.color]}
                      strokeWidth={STROKE}
                      strokeDasharray={`${visible} ${CIRCUMFERENCE - visible}`}
                      strokeDashoffset={-offset}
                    >
                      <title>
                        {COLOR_NAMES[entry.color]}: {entry.count} pips ({Math.round((entry.count / total) * 100)}%)
                      </title>
                    </circle>
                  );
                  offset += length;
                  return el;
                });
              })()}
            </g>
            <text x={SIZE / 2} y={SIZE / 2} textAnchor="middle" dominantBaseline="central" className="pie-total-label">
              {total}
            </text>
          </svg>
          <ul className="pie-legend">
            {data.map((entry) => (
              <li key={entry.color}>
                <span className="pie-swatch" style={{ background: PIP_COLOR_HEX[entry.color] }} />
                {COLOR_NAMES[entry.color]}: {entry.count} ({Math.round((entry.count / total) * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
