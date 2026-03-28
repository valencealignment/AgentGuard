"use client";

import { useId } from "react";
import type { Iteration, ScoreResponse } from "@/lib/types";

interface AutoResearcherPanelProps {
  score: ScoreResponse | null;
  iterations: Iteration[];
  onRunIteration?: () => void;
  isRunning?: boolean;
}

export default function AutoResearcherPanel({
  score,
  iterations,
  onRunIteration,
  isRunning,
}: AutoResearcherPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Policy score display */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-foreground/50">
          Policy Score
        </p>
        <p className="text-4xl font-bold tabular-nums text-verdict-allow">
          {score?.policy_score ?? "—"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Catch Rate"
          value={score ? `${Math.round(score.catch_rate * 100)}%` : "—"}
        />
        <StatCard
          label="FP Rate"
          value={score ? `${Math.round(score.fp_rate * 100)}%` : "—"}
        />
      </div>

      {/* Sparkline */}
      <Sparkline points={iterations.map((i) => i.score)} />

      {/* Iteration history */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-wider text-foreground/50">
          Iterations
        </p>
        {iterations.map((iter) => (
          <div
            key={iter.id}
            className="flex items-center justify-between rounded bg-surface-2 px-2 py-1.5 text-xs"
          >
            <span className="font-mono text-foreground/70">{iter.label}</span>
            <span className="tabular-nums">
              {iter.score}
              {iter.delta > 0 && (
                <span className="ml-1 text-verdict-allow">+{iter.delta}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Run button */}
      <button
        onClick={onRunIteration}
        disabled={isRunning}
        className="shrink-0 rounded bg-accent-blue px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isRunning ? "Running…" : "Run Iteration"}
      </button>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const gradientId = useId();

  if (points.length < 2) return <div className="h-12 rounded bg-surface-2" />;

  const w = 200;
  const h = 48;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (w - 2 * pad),
    y: pad + (1 - (v - min) / range) * (h - 2 * pad),
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const gradientPath = `M${coords[0].x},${coords[0].y} ${coords.map((c) => `L${c.x},${c.y}`).join(" ")} L${coords[coords.length - 1].x},${h} L${coords[0].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full rounded bg-surface-2">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-verdict-allow)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-verdict-allow)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={gradientPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-verdict-allow)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface-2 p-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
