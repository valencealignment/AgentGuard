"use client";

import type { Decision } from "@/lib/types";
import { VerdictBadge } from "./VerdictBadge";
import { SignalChip } from "./SignalChip";

interface DecisionDetailProps {
  decision: Decision | null;
  onViewThread?: (threadId: string) => void;
}

export default function DecisionDetail({ decision, onViewThread }: DecisionDetailProps) {
  if (!decision) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-foreground/40">
          Select an entry to view details
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <VerdictBadge verdict={decision.verdict} />
        <h2 className="text-sm font-semibold text-foreground truncate">
          {decision.target}
        </h2>
        {decision.version && (
          <span className="text-xs text-foreground/40">=={decision.version}</span>
        )}
      </div>

      {/* Real attack callout */}
      {decision.is_real_attack && (
        <div className="rounded border border-verdict-escalate/30 bg-verdict-escalate/10 px-3 py-2">
          <p className="text-xs font-semibold text-verdict-escalate">
            Confirmed Real Attack
          </p>
          <p className="text-[10px] text-verdict-escalate/80 mt-0.5">
            This is a verified supply-chain attack detected in the wild.
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MetaField label="Action Type" value={decision.action_type} />
        <MetaField label="Agent" value={decision.agent_id} />
        <MetaField
          label="Confidence"
          value={`${Math.round(decision.confidence * 100)}%`}
        />
        <MetaField label="Duration" value={`${decision.duration_ms}ms`} />
        <MetaField
          label="Timestamp"
          value={new Date(decision.timestamp).toLocaleString("en-US", {
            hour12: false,
          })}
        />
        <MetaField label="Thread" value={decision.thread_id} />
        {decision.pypi_status && (
          <MetaField label="PyPI Status" value={decision.pypi_status} />
        )}
      </div>

      {/* Reason */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
          Reason
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed">
          {decision.reason}
        </p>
      </div>

      {/* Provenance */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
          Provenance
        </p>
        <p className="text-xs text-foreground/60 leading-relaxed">
          {decision.provenance}
        </p>
      </div>

      {/* Signals */}
      {decision.signals.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
            Signals
          </p>
          <div className="flex flex-wrap gap-1">
            {decision.signals.map((s) => (
              <SignalChip key={s} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* Rules Triggered */}
      {decision.rules_triggered.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
            Rules Triggered
          </p>
          <div className="flex flex-wrap gap-1">
            {decision.rules_triggered.map((r) => (
              <span
                key={r}
                className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-foreground/60"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Agent Verdicts */}
      {decision.agent_verdicts && decision.agent_verdicts.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">
            Agent Verdicts
          </p>
          <div className="flex flex-col gap-2">
            {decision.agent_verdicts.map((av) => {
              const pct = Math.round(av.confidence * 100);
              const barColor =
                pct >= 80 ? "bg-verdict-block" :
                pct >= 50 ? "bg-verdict-escalate" :
                "bg-verdict-allow";
              return (
                <div key={av.agent} className="rounded bg-surface-2 px-2 py-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-foreground/70 capitalize">
                      {av.agent.replace(/-/g, " ")}
                    </span>
                    <span className="tabular-nums text-foreground/40">{pct}%</span>
                  </div>
                  <p className="text-[10px] text-foreground/50 mt-0.5">{av.finding}</p>
                  <div className="mt-1.5 h-1 rounded-full bg-surface-0 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Agent-Generated Advisory */}
      {decision.advisory_md && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-wider text-foreground/50">
              Agent-Generated Advisory
            </p>
            <span className="rounded bg-accent-blue/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-blue">
              Auto
            </span>
          </div>
          <div className="rounded border border-surface-3 bg-surface-1 p-3">
            <SimpleMarkdown content={decision.advisory_md} />
          </div>
        </div>
      )}

      {/* Thread link */}
      {onViewThread && (
        <button
          onClick={() => onViewThread(decision.thread_id)}
          className="shrink-0 rounded bg-surface-2 px-3 py-2 text-xs font-medium text-foreground/70 hover:bg-surface-3 hover:text-foreground transition-colors"
        >
          View Thread &rarr;
        </button>
      )}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className="font-mono text-foreground/80 truncate">{value}</p>
    </div>
  );
}

/** Lightweight markdown renderer for advisory content (headers, lists, bold, paragraphs). */
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="ml-3 list-disc space-y-0.5 text-[11px] text-foreground/70">
        {listItems.map((item, i) => (
          <li key={i}>{inlineFormat(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  function inlineFormat(text: string): React.ReactNode {
    // Bold: **text** or __text__, Code: `text`
    const parts = text.split(/(`.+?`|\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="rounded bg-surface-2 px-1 py-0.5 text-[10px] font-mono text-accent-blue">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("__") && part.endsWith("__")) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      flushList();
      // Skip the top-level title — it's redundant with the section header
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h4 key={key++} className="mt-3 mb-1 text-xs font-semibold text-foreground/90">
          {trimmed.slice(3)}
        </h4>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList();
    } else if (trimmed.startsWith("Date:")) {
      // Skip metadata line
      continue;
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-[11px] leading-relaxed text-foreground/70">
          {inlineFormat(trimmed)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-1">{elements}</div>;
}
