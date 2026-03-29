"use client";

import { useEffect, useState } from "react";
import type { ScoreResponse } from "@/lib/types";

interface ArchitectureDiagramProps {
  score: ScoreResponse | null;
  iterationCount: number;
}

type NodeId = "codex" | "hook" | "guard" | "rules" | "research" | "enforcement" | "merck" | "dashboard" | "human";

const FLOW_SEQUENCE: NodeId[] = ["codex", "guard", "research", "enforcement", "merck", "dashboard"];

const NODE_STYLES: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  blue:   { bg: "bg-accent-blue/10", border: "border-accent-blue/30", text: "text-accent-blue", ring: "ring-accent-blue/50" },
  red:    { bg: "bg-verdict-block/10", border: "border-verdict-block/30", text: "text-verdict-block", ring: "ring-verdict-block/50" },
  green:  { bg: "bg-verdict-allow/10", border: "border-verdict-allow/30", text: "text-verdict-allow", ring: "ring-verdict-allow/50" },
  purple: { bg: "bg-[#a78bfa]/10", border: "border-[#a78bfa]/30", text: "text-[#a78bfa]", ring: "ring-[#a78bfa]/50" },
  yellow: { bg: "bg-verdict-escalate/10", border: "border-verdict-escalate/30", text: "text-verdict-escalate", ring: "ring-verdict-escalate/50" },
};

export default function ArchitectureDiagram({ score, iterationCount }: ArchitectureDiagramProps) {
  const [activeNode, setActiveNode] = useState<NodeId>("codex");

  useEffect(() => {
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % FLOW_SEQUENCE.length;
      setActiveNode(FLOW_SEQUENCE[step]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-auto p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">System Architecture</h2>
          <p className="text-[10px] text-foreground/40">Live data flow visualization</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px]">
          <span className="h-2 w-2 rounded-full bg-accent-blue animate-pulse-dot" />
          <span className="text-foreground/50">Data flowing</span>
        </span>
      </div>

      {/* ── Local zone ─────────────────────────────────── */}
      <div className="rounded-xl border border-dashed border-surface-3 bg-surface-1/50 p-6 mb-3">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
          User&apos;s laptop (local)
        </p>

        {/* 3-column grid: left=Codex col, center=Guard col, right=Rules col */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-y-5">
          {/* Row 1: Codex → Guard → Rules */}
          <div className="flex justify-center">
            <Node id="codex" label="Codex Agent" sub="Writes code" color="blue" active={activeNode === "codex"} />
          </div>
          <Arrow label="pip install" active={activeNode === "codex"} />
          <div className="flex justify-center">
            <Node id="guard" label="WAASL Guard" sub="Deterministic checker" color="red" active={activeNode === "guard"} primary counter={score ? `${score.total_evaluated} evaluated` : undefined} />
          </div>
          <Arrow active={activeNode === "guard"} />
          <div className="flex justify-center">
            <Node id="rules" label="waasl-rules.yaml" sub="Firewall rules" color="green" active={activeNode === "guard"} />
          </div>

          {/* Row 2: Hook (under Codex) | Verdicts (under Guard) | empty (under Rules) */}
          <div className="flex flex-col items-center gap-2">
            <Arrow vertical active={activeNode === "codex"} />
            <Node id="hook" label="Pre-action Hook" sub="Intercepts actions" color="purple" active={activeNode === "codex"} />
          </div>
          <div /> {/* arrow spacer */}
          <div className="flex flex-col items-center gap-2">
            <Arrow vertical active={activeNode === "guard"} />
            <div className="flex items-center gap-3">
              <VerdictChip label="Allow" variant="allow" count={score?.total_allowed} />
              <VerdictChip label="Warn" variant="warn" count={score?.total_escalated} />
              <VerdictChip label="Block" variant="block" count={score?.total_blocked} />
            </div>
          </div>
          <div /> {/* arrow spacer */}
          {/* Rule sync dashed line going down from rules column — top half */}
          <div className="flex flex-col items-center">
            <div className={`w-px h-full min-h-[40px] border-l border-dashed transition-colors duration-500 ${activeNode === "merck" ? "border-verdict-allow/60" : "border-surface-3"}`} />
          </div>
        </div>
      </div>

      {/* ── Connectors between zones (center + right "rule sync" column) ── */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] my-1">
        <div />
        <div />
        <div className="flex justify-center">
          <div className="h-8 w-px border-l border-dashed border-surface-3" />
        </div>
        <div />
        {/* Rule sync dashed line — middle segment */}
        <div className="flex flex-col items-center">
          <div className={`w-px h-8 border-l border-dashed transition-colors duration-500 ${activeNode === "merck" ? "border-verdict-allow/60" : "border-surface-3"}`} />
          <span className={`text-[8px] transition-colors duration-500 ${activeNode === "merck" ? "text-verdict-allow" : "text-foreground/25"}`}>Rule sync</span>
        </div>
      </div>

      {/* ── Cloud zone ─────────────────────────────────── */}
      <div className="rounded-xl border border-dashed border-surface-3 bg-surface-1/50 p-6 mb-3">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-wider text-foreground/30">
          Cloud compute
        </p>

        {/* 3-column grid matching the local zone columns */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
          <div className="flex justify-center">
            <Node id="research" label="Research Agent" sub="CVEs, packages, MCP scans" color="purple" active={activeNode === "research"} />
          </div>
          <Arrow active={activeNode === "research"} />
          <div className="flex justify-center">
            <Node id="enforcement" label="Enforcement Agent" sub="Decides & explains" color="red" active={activeNode === "enforcement"} />
          </div>
          <Arrow active={activeNode === "enforcement"} />
          <div className="flex flex-col items-center gap-1">
            {/* Dashed line going up toward Rule sync connector */}
            <div className={`w-px h-4 border-l border-dashed transition-colors duration-500 ${activeNode === "merck" ? "border-verdict-allow/60" : "border-surface-3"}`} />
            <svg viewBox="0 0 8 6" className={`h-1.5 w-2 rotate-180 ${activeNode === "merck" ? "text-verdict-allow" : "text-surface-3"} transition-colors duration-500`}>
              <path d="M0 0 L4 6 L8 0 Z" fill="currentColor" />
            </svg>
            <Node id="merck" label="MERCK Loop" sub="Self-improving rules" color="green" active={activeNode === "merck"} counter={`${iterationCount} iterations`} />
          </div>
        </div>
      </div>

      {/* ── Bottom outputs: aligned to cloud columns ──── */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start mt-2">
        {/* Dashboard under Research (col 1) */}
        <div className="flex flex-col items-center gap-2">
          <Arrow vertical dashed active={activeNode === "research"} />
          <Node id="dashboard" label="Dashboard" sub="Real-time verdicts" color="blue" active={activeNode === "dashboard"} counter="Live" />
        </div>
        <div /> {/* arrow spacer */}
        {/* Human under Enforcement (col 3) */}
        <div className="flex flex-col items-center gap-2">
          <Arrow vertical label="Escalations" active={activeNode === "enforcement"} />
          <Node id="human" label="Human" sub="Approves, decides" color="yellow" active={activeNode === "enforcement"} />
        </div>
        <div /> {/* arrow spacer */}
        <div /> {/* empty right column */}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function Node({
  id: _id,
  label,
  sub,
  color,
  active,
  primary,
  counter,
}: {
  id: NodeId;
  label: string;
  sub: string;
  color: string;
  active: boolean;
  primary?: boolean;
  counter?: string;
}) {
  const s = NODE_STYLES[color];
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl px-6 py-4 border transition-all duration-500 min-w-[160px] ${s.bg} ${s.border} ${
        primary ? "border-2" : ""
      } ${active ? `ring-2 ring-offset-2 ring-offset-surface-0 ${s.ring} shadow-lg shadow-current/10` : ""}`}
    >
      {active && (
        <div className={`absolute inset-0 rounded-xl border-2 ${s.border} animate-ping opacity-15`} />
      )}
      <span className={`text-sm font-bold ${s.text}`}>{label}</span>
      <span className="text-[10px] text-foreground/40 text-center mt-0.5">{sub}</span>
      {counter && (
        <span className="mt-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-mono text-foreground/50">
          {counter}
        </span>
      )}
    </div>
  );
}

function Arrow({
  label,
  vertical,
  dashed,
  active,
}: {
  label?: string;
  vertical?: boolean;
  dashed?: boolean;
  active?: boolean;
}) {
  if (vertical) {
    return (
      <div className="flex flex-col items-center">
        {label && (
          <span className="text-[9px] text-foreground/30 mb-1">{label}</span>
        )}
        <div className="flex flex-col items-center">
          <div
            className={`w-px h-8 transition-colors duration-500 ${
              dashed ? "border-l border-dashed" : ""
            } ${active ? "bg-accent-blue border-accent-blue" : "bg-surface-3 border-surface-3"}`}
          />
          <svg viewBox="0 0 8 6" className={`h-1.5 w-2 ${active ? "text-accent-blue" : "text-surface-3"} transition-colors duration-500`}>
            <path d="M0 0 L4 6 L8 0 Z" fill="currentColor" />
          </svg>
        </div>
        {active && (
          <div className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse-dot mt-0.5" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-2">
      {label && (
        <span className="text-[9px] text-foreground/30 mb-1">{label}</span>
      )}
      <div className="flex items-center">
        <div
          className={`h-px w-14 transition-colors duration-500 ${
            dashed ? "border-t border-dashed" : ""
          } ${active ? "bg-accent-blue border-accent-blue" : "bg-surface-3 border-surface-3"}`}
        />
        <svg viewBox="0 0 6 8" className={`h-2 w-1.5 ${active ? "text-accent-blue" : "text-surface-3"} transition-colors duration-500`}>
          <path d="M0 0 L6 4 L0 8 Z" fill="currentColor" />
        </svg>
        {active && (
          <div className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse-dot ml-0.5" />
        )}
      </div>
    </div>
  );
}

function VerdictChip({ label, variant, count }: { label: string; variant: "allow" | "warn" | "block"; count?: number }) {
  const styles = {
    allow: "text-verdict-allow bg-verdict-allow/15 border-verdict-allow/30",
    warn: "text-verdict-escalate bg-verdict-escalate/15 border-verdict-escalate/30",
    block: "text-verdict-block bg-verdict-block/15 border-verdict-block/30",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${styles[variant]}`}>
      {label}{count != null && count > 0 ? ` (${count})` : ""}
    </span>
  );
}

