import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { guardFetch } from "@/lib/guard-client";
import { DEMO_SCENARIOS } from "@/lib/demo-scenarios";

const LIVE_VERDICTS_PATH = join(process.cwd(), "ops", "events", "live_verdicts.jsonl");
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  // Clear previous live verdicts so each demo run is fresh
  try {
    await writeFile(LIVE_VERDICTS_PATH, "", "utf-8");
  } catch {
    // Directory may not exist yet — guard will create it on first /check
  }

  const results: Array<{ target: string; verdict: string; reason: string }> = [];

  for (const scenario of DEMO_SCENARIOS) {
    const response = await guardFetch<Record<string, unknown>>("/check", {
      method: "POST",
      body: JSON.stringify(scenario.action),
    });

    if (response) {
      results.push({
        target: scenario.action.target,
        verdict: String(response.verdict ?? "unknown").toUpperCase(),
        reason: String(response.reason ?? ""),
      });
    } else {
      results.push({
        target: scenario.action.target,
        verdict: "OFFLINE",
        reason: "Guard backend unreachable",
      });
    }

    await sleep(DELAY_MS);
  }

  const blocked = results.filter((r) => r.verdict === "BLOCK").length;
  const allowed = results.filter((r) => r.verdict === "ALLOW").length;

  return NextResponse.json({
    ok: true,
    total: results.length,
    blocked,
    allowed,
    results,
  });
}
