import { NextResponse } from "next/server";
import { guardFetch } from "@/lib/guard-client";

export async function GET() {
  const live = await guardFetch<Record<string, unknown>>("/status");

  if (live) {
    return NextResponse.json(live);
  }

  return NextResponse.json({ ok: false, reason: "guard unreachable" });
}
