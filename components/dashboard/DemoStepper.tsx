"use client";

import { useEffect } from "react";

const DEMO_STEPS = [
  { label: "Real Attack", shortcut: "1" },
  { label: "Agent Advisory", shortcut: "2" },
  { label: "Self-Correcting", shortcut: "3" },
  { label: "Threat Intel", shortcut: "4" },
  { label: "Escalation", shortcut: "5" },
  { label: "Live Lookup", shortcut: "6" },
] as const;

interface DemoStepperProps {
  currentStep: number | null;
  onStep: (step: number) => void;
}

export default function DemoStepper({ currentStep, onStep }: DemoStepperProps) {
  // Keyboard navigation: arrow keys and number keys
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentStep === null ? 0 : Math.min(currentStep + 1, DEMO_STEPS.length - 1);
        onStep(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentStep === null ? 0 : Math.max(currentStep - 1, 0);
        onStep(prev);
      } else {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= DEMO_STEPS.length) {
          onStep(num - 1);
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentStep, onStep]);

  return (
    <div className="flex shrink-0 items-center justify-center gap-4 border-b border-surface-2 bg-surface-1 px-4 py-2">
      {DEMO_STEPS.map((step, i) => {
        const isActive = currentStep === i;
        const isCompleted = currentStep !== null && i < currentStep;

        return (
          <button
            key={i}
            onClick={() => onStep(i)}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${
              isActive
                ? "bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40"
                : isCompleted
                  ? "bg-surface-2 text-foreground/60"
                  : "text-foreground/30 hover:text-foreground/50"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                isActive
                  ? "bg-accent-blue text-white"
                  : isCompleted
                    ? "bg-foreground/20 text-foreground/60"
                    : "bg-surface-2 text-foreground/30"
              }`}
            >
              {isCompleted ? "✓" : i + 1}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
