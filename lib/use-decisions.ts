"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Decision } from "./types";

const POLL_INTERVAL = 2000;
const ANIMATION_DURATION = 600;

export function useDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const sinceRef = useRef<string | null>(null);
  const isFirstFetch = useRef(true);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDecisions = useCallback(async () => {
    const params = new URLSearchParams();
    if (sinceRef.current) {
      params.set("since", sinceRef.current);
    }
    const url = `/api/decisions${params.toString() ? `?${params}` : ""}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: Decision[] = await res.json();

      setDecisions((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        const incoming = data.filter((d) => !existingIds.has(d.id));

        const merged = [...prev, ...incoming];

        // Sort: litellm (is_real_attack) always first, then by timestamp desc
        merged.sort((a, b) => {
          if (a.is_real_attack && !b.is_real_attack) return -1;
          if (!a.is_real_attack && b.is_real_attack) return 1;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        // Update since watermark using numeric comparison
        if (merged.length > 0) {
          const latest = merged.reduce((max, d) => {
            const t = new Date(d.timestamp).getTime();
            return t > new Date(max).getTime() ? d.timestamp : max;
          }, merged[0].timestamp);
          sinceRef.current = latest;
        }

        // Track new entries for animation (outside updater logic via closure)
        if (!isFirstFetch.current && incoming.length > 0) {
          // Clear any pending animation timeout
          if (animationTimer.current) clearTimeout(animationTimer.current);
          // Schedule newIds update after this render
          queueMicrotask(() => {
            setNewIds(new Set(incoming.map((d) => d.id)));
            animationTimer.current = setTimeout(
              () => setNewIds(new Set()),
              ANIMATION_DURATION
            );
          });
        }

        isFirstFetch.current = false;
        return merged;
      });
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
    const id = setInterval(fetchDecisions, POLL_INTERVAL);
    return () => {
      clearInterval(id);
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, [fetchDecisions]);

  return { decisions, newIds };
}
