"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_SCENARIOS } from "@/lib/demo-scenarios";

interface DemoTerminalProps {
  open: boolean;
  onClose: () => void;
}

interface TermLine {
  text: string;
  color: "red" | "green" | "dim" | "bold" | "cyan" | "default";
}

function buildLines(): TermLine[] {
  const lines: TermLine[] = [
    { text: "══════════════════════════════════════════════════════════════", color: "red" },
    { text: "  UNPROTECTED AGENT — NO GUARD ACTIVE", color: "red" },
    { text: "══════════════════════════════════════════════════════════════", color: "red" },
    { text: "", color: "default" },
    { text: "Every action is executed blindly. No check. No block. No review.", color: "dim" },
    { text: "", color: "default" },
  ];

  let safe = 0;
  let compromised = 0;

  for (const scenario of DEMO_SCENARIOS) {
    const verb = scenario.action.action_type === "mcp_call" ? "curl -sSL" : "pip install";
    lines.push({ text: "──────────────────────────────────────────────────────────────", color: "dim" });
    lines.push({ text: `Agent prompt: ${scenario.prompt}`, color: "bold" });
    lines.push({ text: `Agent action: ${verb} ${scenario.action.target}`, color: "dim" });

    if (scenario.risk) {
      lines.push({ text: `  ✓ EXECUTED  ← ${scenario.risk}`, color: "red" });
      compromised++;
    } else {
      lines.push({ text: "  ✓ EXECUTED  (safe — no issue)", color: "green" });
      safe++;
    }
  }

  lines.push({ text: "──────────────────────────────────────────────────────────────", color: "dim" });
  lines.push({ text: "", color: "default" });
  lines.push({ text: `Result: ${safe} safe, ${compromised} compromised`, color: "bold" });
  lines.push({ text: "", color: "default" });
  lines.push({ text: `The unprotected agent executed every action — including ${compromised} attacks.`, color: "red" });
  lines.push({ text: "SSH keys exfiltrated. Cloud credentials stolen. Persistent backdoor installed.", color: "red" });
  lines.push({ text: "", color: "default" });
  lines.push({ text: "Close this panel, then click \"Protected Agent\" to see AgentGuard block them all.", color: "cyan" });

  return lines;
}

const COLOR_MAP: Record<TermLine["color"], string> = {
  red: "text-verdict-block font-semibold",
  green: "text-verdict-allow",
  dim: "text-foreground/40",
  bold: "text-foreground font-semibold",
  cyan: "text-accent-blue",
  default: "text-foreground/70",
};

export default function DemoTerminal({ open, onClose }: DemoTerminalProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const allLines = useRef(buildLines());

  // Type out lines one at a time
  useEffect(() => {
    if (!open) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(1);
    const id = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= allLines.current.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(id);
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const lines = allLines.current.slice(0, visibleCount);
  const done = visibleCount >= allLines.current.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-[90vw] max-w-4xl flex-col rounded-lg border border-surface-3 bg-[#0c0c0c] shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-surface-3 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-verdict-block" />
            <span className="h-3 w-3 rounded-full bg-verdict-escalate" />
            <span className="h-3 w-3 rounded-full bg-verdict-allow" />
            <span className="ml-3 text-xs font-mono text-foreground/50">
              unprotected-agent — bash
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-foreground/40 hover:text-foreground transition-colors"
          >
            {done ? "Close (Esc)" : "Skip (Esc)"}
          </button>
        </div>

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
        >
          {lines.map((line, i) => (
            <div key={i} className={COLOR_MAP[line.color]}>
              {line.text || "\u00A0"}
            </div>
          ))}
          {!done && (
            <span className="inline-block h-4 w-2 animate-pulse bg-foreground/60" />
          )}
        </div>
      </div>
    </div>
  );
}
