import { NextResponse } from "next/server";
import { peekDripFeedDecisions } from "@/lib/mock-data";
import { getCurrentScore } from "@/lib/mock-iterations";
import type { ScoreResponse } from "@/lib/types";

export async function GET() {
  // TODO: return fetch("http://localhost:8002/score")
  const decisions = peekDripFeedDecisions();
  const score = getCurrentScore();

  const totalBlocked = decisions.filter((d) => d.verdict === "BLOCK").length;
  const totalAllowed = decisions.filter((d) => d.verdict === "ALLOW").length;
  const totalEscalated = decisions.filter(
    (d) => d.verdict === "ESCALATE" || d.verdict === "WARN"
  ).length;

  const response: ScoreResponse = {
    policy_score: score,
    catch_rate: 0.9,
    fp_rate: 0.04,
    total_evaluated: decisions.length,
    total_blocked: totalBlocked,
    total_allowed: totalAllowed,
    total_escalated: totalEscalated,
  };

  return NextResponse.json(response);
}
