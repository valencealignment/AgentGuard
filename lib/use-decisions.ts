"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Decision } from "./types";

const POLL_INTERVAL = 2000;
const LIVE_POLL_INTERVAL = 1500; // Slightly faster for live verdicts
const ANIMATION_DURATION = 600;

function sortDecisions(list: Decision[]): Decision[] {
  return list.sort((a, b) => {
    if (a.is_real_attack && !b.is_real_attack) return -1;
    if (!a.is_real_attack && b.is_real_attack) return 1;
    // Live verdicts sort to top (after real attacks) by recency
    if (a.is_live && !b.is_live && !b.is_real_attack) return -1;
    if (!a.is_live && b.is_live && !a.is_real_attack) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export function useDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const sinceRef = useRef<string | null>(null);
  const isFirstFetch = useRef(true);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mergeIncoming = useCallback((data: Decision[], animate: boolean) => {
    setDecisions((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const incoming = data.filter((d) => !existingIds.has(d.id));
      if (incoming.length === 0) return prev;

      const merged = sortDecisions([...prev, ...incoming]);

      if (merged.length > 0) {
        const latest = merged.reduce((max, d) => {
          const t = new Date(d.timestamp).getTime();
          return t > new Date(max).getTime() ? d.timestamp : max;
        }, merged[0].timestamp);
        sinceRef.current = latest;
      }

      if (animate && incoming.length > 0) {
        if (animationTimer.current) clearTimeout(animationTimer.current);
        queueMicrotask(() => {
          setNewIds(new Set(incoming.map((d) => d.id)));
          animationTimer.current = setTimeout(
            () => setNewIds(new Set()),
            ANIMATION_DURATION
          );
        });
      }

      return merged;
    });
  }, []);

  // Drip-feed poll (mock decisions)
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
      mergeIncoming(data, !isFirstFetch.current);
      isFirstFetch.current = false;
    } catch {
      // silently ignore
    }
  }, [mergeIncoming]);

  // Live verdict poll (from guard /check results)
  const fetchLiveVerdicts = useCallback(async () => {
    try {
      const res = await fetch("/api/autoresearcher/live-verdicts");
      if (!res.ok) return;
      const data: Decision[] = await res.json();
      mergeIncoming(data, true);
    } catch {
      // silently ignore — guard may be down
    }
  }, [mergeIncoming]);

  // Initial load: fetch scenarios + first decisions together, then start polling.
  useEffect(() => {
    async function initialLoad() {
      const [scenarios, drip, live] = await Promise.all([
        fetch("/api/scenarios").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/decisions").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/autoresearcher/live-verdicts").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      const allDecisions: Decision[] = [...drip, ...live];
      const existingTargets = new Set(allDecisions.map((d: Decision) => d.target));

      for (const sd of scenarios as Decision[]) {
        if (!existingTargets.has(sd.target)) {
          allDecisions.push(sd);
          existingTargets.add(sd.target);
        }
      }

      const sorted = sortDecisions(allDecisions);

      if (sorted.length > 0) {
        const latest = sorted.reduce((max, d) => {
          const t = new Date(d.timestamp).getTime();
          return t > new Date(max).getTime() ? d.timestamp : max;
        }, sorted[0].timestamp);
        sinceRef.current = latest;
      }

      isFirstFetch.current = false;
      setDecisions(sorted);

      // Start both polls
      pollRef.current = setInterval(fetchDecisions, POLL_INTERVAL);
      livePollRef.current = setInterval(fetchLiveVerdicts, LIVE_POLL_INTERVAL);
    }

    initialLoad();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (livePollRef.current) clearInterval(livePollRef.current);
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, [fetchDecisions, fetchLiveVerdicts]);

  return { decisions, newIds };
}
