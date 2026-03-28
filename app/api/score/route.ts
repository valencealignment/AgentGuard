import { NextResponse } from "next/server";
import { guardFetch } from "@/lib/guard-client";
import { transformMetrics, type GuardMetricsResponse } from "@/lib/guard-transforms";
import { peekDripFeedDecisions } from "@/lib/mock-data";
import { getCurrentScore } from "@/lib/mock-iterations";
import type { ScoreResponse } from "@/lib/types";

export async function GET() {
  const live = await guardFetch<GuardMetricsResponse>("/metrics");

  if (live) {
    return NextResponse.json(transformMetrics(live));
  }

  // Fallback to mock
  const decisions = peekDripFeedDecisions();
  const score = getCurrentScore();
  const response: ScoreResponse = {
    policy_score: score,
    catch_rate: 0.9,
    fp_rate: 0.04,
    total_evaluated: decisions.length,
    total_blocked: decisions.filter((d) => d.verdict === "BLOCK").length,
    total_allowed: decisions.filter((d) => d.verdict === "ALLOW").length,
    total_escalated: decisions.filter(
      (d) => d.verdict === "ESCALATE" || d.verdict === "WARN",
    ).length,
  };
  return NextResponse.json(response);
}
