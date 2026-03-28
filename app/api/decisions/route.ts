import { type NextRequest, NextResponse } from "next/server";
import { loadDecisions } from "@/lib/repo-artifacts";

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
  let decisions = loadDecisions();

  // The integrated branch uses checked-in WAAL artifacts, so string comparison on
  // ISO timestamps is stable enough for polling without introducing stateful cursors.
  if (since) {
    decisions = decisions.filter((d) => d.timestamp > since);
  }

  return NextResponse.json(decisions);
}
