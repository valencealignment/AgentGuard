"use client";

import { useState, useEffect, useRef } from "react";

interface CountdownTimerProps {
  resetKey: string;
  onExpire?: () => void;
}

export function CountdownTimer({ resetKey, onExpire }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(600); // 10 minutes
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSeconds(600);
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          onExpireRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [resetKey]);

  if (seconds <= 0) {
    return (
      <span className="font-mono text-xs font-semibold text-verdict-block">
        Expired
      </span>
    );
  }

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
