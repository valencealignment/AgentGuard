import { type NextRequest, NextResponse } from "next/server";
import { getDripFeedDecisions } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get("since");
  let decisions = getDripFeedDecisions();

  // ISO 8601 strings sort lexicographically, so string comparison is correct here
  if (since) {
    decisions = decisions.filter((d) => d.timestamp > since);
  }

  return NextResponse.json(decisions);
}
