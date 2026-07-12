import { useState } from "react";
import { useTheme } from "../theme/ThemeContext";

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartSimpleProps {
  data: BarDatum[];
  height?: number;
  barColor?: string;
  unit?: string;
  formatValue?: (v: number) => string;
}

export default function BarChartSimple({
  data,
  height = 180,
  barColor,
  unit = "",
  formatValue,
}: BarChartSimpleProps) {
  const { tokens } = useTheme();
  const [hovered, setHovered] = useState<number | null>(null);

  const color = barColor ?? tokens.chartBar;
  const max = Math.max(...data.map((d) => d.value), 1);

  const paddingLeft = 36;
  const paddingBottom = 24;
  const paddingTop = 8;
  const paddingRight = 8;
  const chartH = height - paddingBottom - paddingTop;

  const yTicks = 4;
  const yStep = Math.ceil(max / yTicks);
  const yMax = yStep * yTicks;

  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 560 ${height}`}
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Y grid lines + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = i * yStep;
          const y = paddingTop + chartH - (val / yMax) * chartH;
          return (
            <g key={`ytick-${i}`}>
              <line
                x1={paddingLeft}
                x2={560 - paddingRight}
                y1={y}
                y2={y}
                stroke={tokens.border}
                strokeWidth={1}
                opacity={0.6}
              />
              <text
                x={paddingLeft - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={tokens.mutedForeground}
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                {fmt(val)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const slotW = (560 - paddingLeft - paddingRight) / data.length;
          const barW = Math.max(Math.min(slotW * 0.55, 40), 10);
          const x = paddingLeft + i * slotW + slotW / 2 - barW / 2;
          const barH = (d.value / yMax) * chartH;
          const y = paddingTop + chartH - barH;
          const isHov = hovered === i;

          return (
            <g
              key={`bar-${i}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 2)}
                rx={4}
                fill={color}
                opacity={isHov ? 1 : 0.82}
              />
              {/* X label */}
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={10}
                fill={tokens.mutedForeground}
                style={{ fontFamily: "'Figtree', sans-serif" }}
              >
                {d.label}
              </text>
              {/* Hover value */}
              {isHov && (
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={700}
                  fill={tokens.foreground}
                  style={{ fontFamily: "'Figtree', sans-serif" }}
                >
                  {fmt(d.value)}{unit}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
