"use client";

import { useId, useState } from "react";
import type { Iteration, ScoreResponse } from "@/lib/types";

interface AutoResearcherPanelProps {
  score: ScoreResponse | null;
  iterations: Iteration[];
  onRunIteration?: () => void;
  isRunning?: boolean;
}

// Static training results from the Vast RTX 5090 run that achieved F1=1.0
const TRAINING_RUN = {
  gpu: "RTX 5090",
  status: "complete" as const,
  val_bpb: 1.027379,
  steps: 5518,
  epochs: 2,
  duration_s: 1800,
  tok_per_sec: 402_438,
  mfu_pct: 4.88,
  peak_vram_mb: 4390,
  total_tokens_m: 723.3,
  params_m: 26.3,
  depth: 6,
  instance_id: "33735286",
  // Sampled loss values from the training log for sparkline
  loss_curve: [
    4.52, 4.21, 3.89, 3.65, 3.48, 3.34, 3.22, 3.14, 3.08, 3.02,
    2.97, 2.94, 2.91, 2.89, 2.88, 2.87, 2.87, 2.86, 2.87, 2.89,
  ],
};

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

      {/* Sparkline — only kept iterations represent actual score progression */}
      <div>
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[9px] text-foreground/40">Policy Score Trend</span>
          <span className="text-[9px] text-foreground/40">{iterations.length} iterations</span>
        </div>
        <Sparkline points={iterations.filter((i) => i.kept !== false).map((i) => i.score)} />
      </div>

      {/* Training infrastructure card */}
      <TrainingCard />

      {/* Iteration history */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-wider text-foreground/50">
          Iterations
        </p>
        {iterations.map((iter) => {
          const rolledBack = iter.kept === false;
          return (
            <div
              key={iter.id}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${
                rolledBack
                  ? "bg-verdict-block/10 border border-verdict-block/20"
                  : "bg-surface-2"
              }`}
            >
              <span
                className={`font-mono ${
                  rolledBack ? "text-verdict-block" : "text-foreground/70"
                }`}
              >
                {iter.label}
                {rolledBack && (
                  <span className="ml-1.5 text-[10px] font-semibold text-verdict-block">
                    ✕ rolled back
                  </span>
                )}
              </span>
              <span className="tabular-nums">
                {rolledBack ? (
                  <span className="text-verdict-block">{iter.delta}</span>
                ) : (
                  <>
                    {iter.score}
                    {iter.delta > 0 && (
                      <span className="ml-1 text-verdict-allow">
                        +{iter.delta}
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Run button */}
      <button
        onClick={onRunIteration}
        disabled={isRunning}
        className="shrink-0 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-accent-blue/30 disabled:opacity-50"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
            Running…
          </span>
        ) : "Run Iteration"}
      </button>
    </div>
  );
}

function TrainingCard() {
  const [showTooltip, setShowTooltip] = useState(false);
  const t = TRAINING_RUN;

  return (
    <div
      className="relative rounded border border-surface-3 bg-surface-1 p-2.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">
          Training
        </span>
        <span className="flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
          {t.gpu}
        </span>
        <span className="flex items-center gap-1 rounded bg-verdict-allow/15 px-1.5 py-0.5 text-[10px] font-semibold text-verdict-allow">
          <span className="h-1.5 w-1.5 rounded-full bg-verdict-allow" />
          Complete
        </span>
      </div>

      {/* Loss sparkline */}
      <div className="mt-2">
        <LossSparkline points={t.loss_curve} />
      </div>

      {/* Summary stats */}
      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-foreground/40">
        <span className="font-mono tabular-nums">val_bpb {t.val_bpb.toFixed(3)}</span>
        <span>·</span>
        <span>{t.params_m}M params</span>
        <span>·</span>
        <span>{Math.round(t.duration_s / 60)}m</span>
      </div>

      {/* Hover tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded border border-surface-3 bg-surface-1 p-3 shadow-lg">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
            Training Details
          </p>
          <div className="flex flex-col gap-1 text-[10px]">
            <TooltipRow label="Steps" value={`${t.steps.toLocaleString()} · ${t.epochs} epochs`} />
            <TooltipRow label="Throughput" value={`${(t.tok_per_sec / 1000).toFixed(0)}K tok/s`} />
            <TooltipRow label="MFU" value={`${t.mfu_pct}%`} />
            <TooltipRow label="Peak VRAM" value={`${(t.peak_vram_mb / 1024).toFixed(1)} GB`} />
            <TooltipRow label="Tokens" value={`${t.total_tokens_m}M processed`} />
            <TooltipRow label="Model" value={`${t.params_m}M params · depth ${t.depth}`} />
            <div className="mt-1 border-t border-surface-2 pt-1">
              <TooltipRow label="Platform" value="Vast.ai" />
              <TooltipRow label="Instance" value={t.instance_id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/40">{label}</span>
      <span className="font-mono text-foreground/70">{value}</span>
    </div>
  );
}

function LossSparkline({ points }: { points: number[] }) {
  const gradientId = useId();

  if (points.length < 2) return <div className="h-8 rounded bg-surface-2" />;

  const w = 200;
  const h = 32;
  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (w - 2 * pad),
    y: pad + ((v - min) / range) * (h - 2 * pad), // inverted: higher loss = higher y (loss goes down)
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const gradientPath = `M${coords[0].x},${coords[0].y} ${coords.map((c) => `L${c.x},${c.y}`).join(" ")} L${coords[coords.length - 1].x},${h} L${coords[0].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full rounded bg-surface-2">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent-cyan)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent-cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={gradientPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--color-accent-cyan)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
