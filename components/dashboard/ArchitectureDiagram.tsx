"use client";

import { useEffect, useState } from "react";
import type { ScoreResponse } from "@/lib/types";

interface ArchitectureDiagramProps {
  score: ScoreResponse | null;
  iterationCount: number;
}

// ── Node positions (percentage-based for responsiveness) ────────────

const NODES = {
  codex:       { x: 10, y: 14, w: 14, h: 10, label: "Codex Agent", sub: "Writes code", color: "blue" },
  hook:        { x: 10, y: 34, w: 14, h: 10, label: "Pre-action Hook", sub: "Intercepts actions", color: "purple" },
  guard:       { x: 34, y: 10, w: 18, h: 14, label: "WAASL Guard", sub: "Deterministic checker", color: "red", primary: true },
  rules:       { x: 62, y: 10, w: 14, h: 10, label: "waasl-rules.yaml", sub: "Firewall rules", color: "green" },
  verdicts:    { x: 36, y: 30, w: 14, h: 8,  label: "Verdicts", sub: "", color: "neutral" },
  research:    { x: 10, y: 62, w: 16, h: 12, label: "Research Agent", sub: "CVEs, packages, MCP scans", color: "purple" },
  enforcement: { x: 34, y: 62, w: 18, h: 12, label: "Enforcement Agent", sub: "Decides & explains", color: "red" },
  merck:       { x: 62, y: 62, w: 16, h: 12, label: "MERCK Loop", sub: "Self-improving rules", color: "green" },
  dashboard:   { x: 10, y: 86, w: 14, h: 10, label: "Dashboard", sub: "Real-time verdicts", color: "blue" },
  human:       { x: 36, y: 86, w: 16, h: 10, label: "Human", sub: "Approves, decides", color: "yellow" },
} as const;

type NodeId = keyof typeof NODES;

// ── Edges (animated data flow paths) ────────────────────────────────

const EDGES: { from: NodeId; to: NodeId; label?: string; dashed?: boolean }[] = [
  { from: "codex", to: "guard", label: "pip install" },
  { from: "codex", to: "hook" },
  { from: "hook", to: "guard" },
  { from: "guard", to: "rules" },
  { from: "guard", to: "verdicts" },
  { from: "research", to: "enforcement" },
  { from: "enforcement", to: "merck" },
  { from: "merck", to: "rules", label: "Rule sync", dashed: true },
  { from: "research", to: "dashboard", dashed: true },
  { from: "enforcement", to: "human", label: "Escalations" },
];

// ── Color maps ──────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: "bg-accent-blue/10", border: "border-accent-blue/30", text: "text-accent-blue" },
  red:    { bg: "bg-verdict-block/10", border: "border-verdict-block/30", text: "text-verdict-block" },
  green:  { bg: "bg-verdict-allow/10", border: "border-verdict-allow/30", text: "text-verdict-allow" },
  purple: { bg: "bg-[#a78bfa]/10", border: "border-[#a78bfa]/30", text: "text-[#a78bfa]" },
  yellow: { bg: "bg-verdict-escalate/10", border: "border-verdict-escalate/30", text: "text-verdict-escalate" },
  neutral:{ bg: "bg-surface-2", border: "border-surface-3", text: "text-foreground/70" },
};

// ── Component ───────────────────────────────────────────────────────

export default function ArchitectureDiagram({ score, iterationCount }: ArchitectureDiagramProps) {
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [flowStep, setFlowStep] = useState(0);

  // Cycle through animated flow steps
  useEffect(() => {
    const id = setInterval(() => {
      setFlowStep((s) => (s + 1) % 6);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Determine which nodes are "active" based on flow step
  useEffect(() => {
    const sequence: NodeId[] = ["codex", "guard", "verdicts", "enforcement", "merck", "dashboard"];
    setActiveNode(sequence[flowStep]);
  }, [flowStep]);

  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      {/* Title */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">System Architecture</h2>
          <p className="text-[10px] text-foreground/40">Live data flow visualization</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-blue animate-pulse-dot" />
            <span className="text-foreground/50">Data flowing</span>
          </span>
        </div>
      </div>

      {/* Diagram area */}
      <div className="relative flex-1 rounded-lg border border-surface-2 bg-surface-1">
        {/* Zone labels */}
        <ZoneLabel x={2} y={2} label="User's laptop (local)" />
        <ZoneLabel x={2} y={54} label="Cloud compute" />

        {/* Zone backgrounds */}
        <div className="absolute rounded-lg border border-dashed border-surface-3 bg-surface-0/50"
          style={{ left: "3%", top: "3%", width: "94%", height: "46%" }} />
        <div className="absolute rounded-lg border border-dashed border-surface-3 bg-surface-0/50"
          style={{ left: "3%", top: "53%", width: "94%", height: "28%" }} />

        {/* SVG edges layer */}
        <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }}>
          {EDGES.map((edge, i) => (
            <EdgeLine key={i} edge={edge} activeNode={activeNode} />
          ))}
        </svg>

        {/* Nodes layer */}
        {(Object.entries(NODES) as [NodeId, typeof NODES[NodeId]][]).map(([id, node]) => (
          <NodeBox
            key={id}
            id={id as NodeId}
            node={node}
            isActive={activeNode === id}
            score={score}
            iterationCount={iterationCount}
          />
        ))}

        {/* Verdict chips */}
        <div className="absolute flex gap-2" style={{ left: "34%", top: "33%", zIndex: 10 }}>
          <VerdictChip label="Allow" color="text-verdict-allow bg-verdict-allow/15" count={score?.total_allowed} />
          <VerdictChip label="Warn" color="text-verdict-escalate bg-verdict-escalate/15" count={score?.total_escalated} />
          <VerdictChip label="Block" color="text-verdict-block bg-verdict-block/15" count={score?.total_blocked} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function ZoneLabel({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <span
      className="absolute text-[10px] font-semibold uppercase tracking-wider text-foreground/30"
      style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }}
    >
      {label}
    </span>
  );
}

function NodeBox({
  id,
  node,
  isActive,
  score,
  iterationCount,
}: {
  id: NodeId;
  node: typeof NODES[NodeId];
  isActive: boolean;
  score: ScoreResponse | null;
  iterationCount: number;
}) {
  const colors = NODE_COLORS[node.color];
  const isPrimary = "primary" in node && node.primary;

  // Live counters for specific nodes
  let counter: string | null = null;
  if (id === "guard" && score) counter = `${score.total_evaluated} evaluated`;
  if (id === "merck") counter = `${iterationCount} iterations`;
  if (id === "dashboard") counter = "Live";

  return (
    <div
      className={`absolute flex flex-col items-center justify-center rounded-lg border transition-all duration-500 ${colors.bg} ${colors.border} ${
        isActive
          ? `ring-2 ring-offset-1 ring-offset-surface-1 ${colors.border.replace("border-", "ring-")} shadow-lg`
          : ""
      } ${isPrimary ? "border-2" : ""}`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${node.w}%`,
        height: `${node.h}%`,
        zIndex: 10,
      }}
    >
      {/* Pulse ring when active */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg animate-ping opacity-20"
          style={{ borderWidth: 2, borderColor: "currentColor" }} />
      )}

      <span className={`text-xs font-bold ${colors.text}`}>
        {node.label}
      </span>
      {node.sub && (
        <span className="text-[9px] text-foreground/40 text-center px-1">
          {node.sub}
        </span>
      )}
      {counter && (
        <span className="mt-0.5 rounded bg-surface-2 px-1.5 py-0.5 text-[8px] font-mono text-foreground/50">
          {counter}
        </span>
      )}
    </div>
  );
}

function VerdictChip({ label, color, count }: { label: string; color: string; count?: number }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>
      {label}{count != null ? ` (${count})` : ""}
    </span>
  );
}

function EdgeLine({
  edge,
  activeNode,
}: {
  edge: { from: NodeId; to: NodeId; label?: string; dashed?: boolean };
  activeNode: NodeId | null;
}) {
  const from = NODES[edge.from];
  const to = NODES[edge.to];

  // Center points of nodes (percentage-based)
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h / 2;
  const x2 = to.x + to.w / 2;
  const y2 = to.y + to.h / 2;

  const isActive = activeNode === edge.from;

  return (
    <g>
      {/* Edge line */}
      <line
        x1={`${x1}%`} y1={`${y1}%`}
        x2={`${x2}%`} y2={`${y2}%`}
        stroke={isActive ? "var(--color-accent-blue)" : "var(--color-surface-3)"}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={edge.dashed ? "6 4" : undefined}
        className="transition-all duration-500"
      />

      {/* Animated flow dot */}
      {isActive && (
        <circle r="3" fill="var(--color-accent-blue)">
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={`M${x1},${y1} L${x2},${y2}`}
            // SVG animateMotion with percentage coordinates doesn't work directly,
            // so we use a workaround with the viewBox-relative coordinates
          />
        </circle>
      )}

      {/* Edge label */}
      {edge.label && (
        <text
          x={`${(x1 + x2) / 2}%`}
          y={`${(y1 + y2) / 2 - 1.5}%`}
          textAnchor="middle"
          className="fill-foreground/30 text-[8px]"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
