import { type NextRequest, NextResponse } from "next/server";
import { guardFetch } from "@/lib/guard-client";
import { transformCheckResult, type GuardCheckResponse } from "@/lib/guard-transforms";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await guardFetch<GuardCheckResponse>("/check", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result) {
    // Fallback: synthetic allowed response when guard is offline
    return NextResponse.json({
      id: `mock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action_type: body.action_type ?? "pip_install",
      target: body.target ?? "unknown",
      verdict: "ALLOW",
      confidence: 0.95,
      rules_triggered: [],
      signals: [],
      reason: "Guard backend offline — mock fallback",
      provenance: "mock-fallback",
      thread_id: "",
      duration_ms: 0,
      is_real_attack: false,
    });
  }

  return NextResponse.json(transformCheckResult(result));
}
