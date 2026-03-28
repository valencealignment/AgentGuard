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
