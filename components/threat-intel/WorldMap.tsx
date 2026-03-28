import type { ExposedInstance } from "@/lib/types";

interface WorldMapProps {
  instances: ExposedInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function project(
  lat: number,
  lng: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const x = (lng + 180) * (width / 360);
  const y = (90 - lat) * (height / 180);
  return { x, y };
}

function riskColor(score: number): string {
  if (score >= 85) return "var(--color-verdict-block)";
  if (score >= 60) return "var(--color-verdict-escalate)";
  return "var(--color-verdict-allow)";
}

// Simplified world outline — major landmass boxes (equirectangular)
// This is a minimal representation optimized for dot-plot context
const LAND_PATHS = [
  // North America
  "M50,55 L55,30 L80,25 L110,30 L120,45 L115,55 L105,70 L90,80 L75,70 L60,65 Z",
  // South America
  "M95,85 L105,80 L115,90 L115,120 L105,140 L90,145 L85,130 L80,110 L85,95 Z",
  // Europe
  "M170,30 L175,25 L195,25 L200,35 L195,45 L185,45 L175,40 Z",
  // Africa
  "M170,55 L185,50 L200,55 L205,75 L195,100 L180,105 L170,95 L165,75 Z",
  // Asia
  "M200,20 L230,15 L270,20 L290,30 L295,45 L280,55 L260,55 L240,50 L220,45 L210,40 L200,35 Z",
  // Southeast Asia / Indonesia
  "M270,60 L285,58 L300,65 L295,75 L280,72 L270,68 Z",
  // Australia
  "M280,100 L305,95 L315,105 L310,120 L295,125 L280,115 Z",
];

export default function WorldMap({ instances, selectedId, onSelect }: WorldMapProps) {
  const W = 360;
  const H = 180;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-[180px] w-full rounded bg-surface-1"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ocean background */}
      <rect width={W} height={H} fill="var(--color-surface-1)" />

      {/* Simplified land masses */}
      {LAND_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="var(--color-surface-2)"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.5"
        />
      ))}

      {/* Instance dots */}
      {instances.map((inst) => {
        const { x, y } = project(inst.lat, inst.lng, W, H);
        const isSelected = inst.id === selectedId;
        return (
          <g key={inst.id} onClick={() => onSelect(inst.id)} className="cursor-pointer">
            {/* Pulse ring for selected */}
            {isSelected && (
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="none"
                stroke={riskColor(inst.risk_score)}
                strokeWidth="0.5"
                opacity="0.5"
                className="animate-pulse-dot"
              />
            )}
            {/* Dot */}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? "3.5" : "2.5"}
              fill={riskColor(inst.risk_score)}
              stroke="var(--color-surface-0)"
              strokeWidth="0.5"
              opacity={isSelected ? 1 : 0.8}
            />
            {/* Tooltip (hover) */}
            <title>
              {inst.ip} — Risk: {inst.risk_score}
            </title>
          </g>
        );
      })}
    </svg>
  );
}
