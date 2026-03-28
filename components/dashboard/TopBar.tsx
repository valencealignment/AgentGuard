"use client";

import { useEffect, useState } from "react";
import type { ScoreResponse } from "@/lib/types";

interface TopBarProps {
  score?: ScoreResponse | null;
}

export default function TopBar({ score }: TopBarProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
          " " +
          now.toLocaleTimeString("en-US", { hour12: false })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-2 bg-surface-1 px-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-verdict-allow animate-pulse-dot" />
        <span className="text-sm font-bold tracking-wide text-foreground">
          AgentShield
        </span>
      </div>

      <div className="flex items-center gap-4">
        {score && (
          <>
            <StatPill label="Evaluated" value={score.total_evaluated} />
            <StatPill
              label="Blocked"
              value={score.total_blocked}
              color="text-verdict-block"
            />
            <StatPill
              label="Policy Score"
              value={`${score.policy_score}%`}
              color="text-verdict-allow"
            />
          </>
        )}
        <span className="text-xs text-foreground/40 font-mono tabular-nums">
          {time}
        </span>
      </div>
    </header>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1">
      <span className="text-[10px] uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      <span className={`text-xs font-semibold tabular-nums ${color ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
