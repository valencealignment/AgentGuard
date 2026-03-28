import { NextResponse } from "next/server";
import { guardFetch } from "@/lib/guard-client";
import { transformLogRecords, type GuardLogRecord } from "@/lib/guard-transforms";
import { getIterations } from "@/lib/mock-iterations";

export async function GET() {
  const live = await guardFetch<GuardLogRecord[]>("/log");

  if (live) {
    return NextResponse.json(transformLogRecords(live));
  }

  // Fallback to mock
  return NextResponse.json(getIterations());
}
