"use client";

import { useEffect, useState, useCallback } from "react";
import type { ScoreResponse } from "./types";

const POLL_INTERVAL = 3000;

export function useScore() {
  // Seed with baseline values so TopBar and AutoResearcherPanel render
  // immediately instead of showing "—" dashes for the first 1-3 seconds.
  const [score, setScore] = useState<ScoreResponse | null>({
    policy_score: 85,
    catch_rate: 0.9,
    fp_rate: 0.04,
    total_evaluated: 0,
    total_blocked: 0,
    total_allowed: 0,
    total_escalated: 0,
  });

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
