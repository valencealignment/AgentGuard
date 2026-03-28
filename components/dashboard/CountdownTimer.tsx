"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ resetKey }: { resetKey: string }) {
  const [seconds, setSeconds] = useState(600); // 10 minutes

  useEffect(() => {
    setSeconds(600);
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resetKey]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds < 120;

  return (
    <span
      className={`font-mono text-xs ${isUrgent ? "font-semibold text-verdict-block" : "text-foreground/50"}`}
    >
      {mins}:{secs.toString().padStart(2, "0")} remaining
    </span>
  );
}
