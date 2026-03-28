"use client";

import { useEffect, useState, useCallback } from "react";
import type { ScoreResponse } from "./types";

const POLL_INTERVAL = 3000;

export function useScore() {
  const [score, setScore] = useState<ScoreResponse | null>(null);

  const fetchScore = useCallback(async () => {
    try {
      const res = await fetch("/api/score");
      if (!res.ok) return;
      const data: ScoreResponse = await res.json();
      setScore(data);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    fetchScore();
    const id = setInterval(fetchScore, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchScore]);

  return score;
}
