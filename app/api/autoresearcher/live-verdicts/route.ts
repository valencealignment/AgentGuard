import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  transformLiveVerdict,
  type GuardCheckResponse,
} from "@/lib/guard-transforms";

const LIVE_VERDICTS_PATH = join(
  process.cwd(),
  "ops",
  "events",
  "live_verdicts.jsonl",
);

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");

  let lines: string[];
  try {
    const raw = await readFile(LIVE_VERDICTS_PATH, "utf-8");
    lines = raw.split("\n").filter((l) => l.trim());
  } catch {
    // File doesn't exist yet — guard hasn't received any /check calls
    return NextResponse.json([]);
  }

  const decisions = lines.map((line, i) => {
    const record = JSON.parse(line) as GuardCheckResponse;
    return transformLiveVerdict(record, i);
  });

  // Filter by timestamp if ?since= is provided
  if (since) {
    const filtered = decisions.filter((d) => d.timestamp > since);
    return NextResponse.json(filtered);
  }

  return NextResponse.json(decisions);
}
