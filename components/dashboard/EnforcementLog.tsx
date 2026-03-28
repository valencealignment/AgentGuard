"use client";

import type { Decision } from "@/lib/types";
import { VERDICT_COLORS } from "@/lib/constants";
import { GOLDEN_INSTANCES } from "@/lib/golden-dataset";
import { VerdictBadge } from "./VerdictBadge";
import { SignalChip } from "./SignalChip";

const GOLDEN_IPS = new Set(GOLDEN_INSTANCES.map((i) => i.ip));

function hasKnownExposure(decision: Decision): boolean {
  if (decision.action_type !== "mcp_call") return false;
  return GOLDEN_IPS.has(decision.target.replace(/^https?:\/\//, "").split(/[:/]/)[0]);
}

interface EnforcementLogProps {
  decisions: Decision[];
  newIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExposureClick?: (ip: string) => void;
}

export default function EnforcementLog({
  decisions,
  newIds,
  selectedId,
  onSelect,
  onExposureClick,
}: EnforcementLogProps) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      {decisions.map((d) => {
        const isSelected = d.id === selectedId;
        const isNew = newIds.has(d.id);
        const colors = VERDICT_COLORS[d.verdict];
        const isRealAttack = d.is_real_attack;

        // Resolve class conflicts: real-attack styling wins for bg/border,
        // selected adds a subtle ring instead of competing background
        const bg = isRealAttack
          ? "bg-surface-1"
          : isSelected
            ? "bg-surface-2"
            : "hover:bg-surface-2/50";
        const border = isRealAttack
          ? "border-verdict-block"
          : isSelected
            ? colors.border
            : "border-transparent";

        return (
          <div
            key={d.id}
            role="row"
            tabIndex={0}
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(d.id); } }}
            className={`text-left rounded-md px-3 py-2 transition-colors cursor-pointer ${
              isNew ? "animate-fade-up" : ""
            } border-l-2 ${border} ${bg} ${
              isRealAttack ? "sticky top-0 z-10" : ""
            } ${isSelected && isRealAttack ? "ring-1 ring-inset ring-foreground/10" : ""}`}
          >
            <div className="flex items-center gap-2">
              <VerdictBadge verdict={d.verdict} />
              <span className="text-sm font-medium text-foreground truncate">
                {d.target}
              </span>
              {d.version && (
                <span className="text-xs text-foreground/40">=={d.version}</span>
              )}
              {isRealAttack && (
                <>
                  <span className="rounded bg-verdict-block/20 px-1.5 py-0.5 text-[10px] font-bold text-verdict-block uppercase">
                    Real Attack
                  </span>
                  <span className="rounded bg-verdict-escalate/20 px-1.5 py-0.5 text-[10px] font-bold text-verdict-escalate uppercase">
                    Centerpiece
                  </span>
                </>
              )}
              {hasKnownExposure(d) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const ip = d.target.replace(/^https?:\/\//, "").split(/[:/]/)[0];
                    onExposureClick?.(ip);
                  }}
                  className="rounded bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-blue hover:bg-accent-blue/25 cursor-pointer"
                >
                  ⬡ known exposure
                </button>
              )}
              <span className="ml-auto text-[10px] text-foreground/30 tabular-nums">
                {new Date(d.timestamp).toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </div>

            <p className="mt-1 text-xs text-foreground/60 line-clamp-2">
              {d.reason}
            </p>

            {isRealAttack && d.signals.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {d.signals.map((s) => (
                  <SignalChip key={s} signal={s} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {decisions.length === 0 && (
        <p className="text-xs text-foreground/40 py-8 text-center">
          Waiting for enforcement decisions...
        </p>
      )}
    </div>
  );
}
