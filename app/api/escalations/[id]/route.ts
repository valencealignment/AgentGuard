import { NextRequest, NextResponse } from "next/server";
import { getEscalation } from "@/lib/mock-escalations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = getEscalation(id);

  if (!report) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
