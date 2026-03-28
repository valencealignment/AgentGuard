import { NextRequest, NextResponse } from "next/server";
import { loadEscalation } from "@/lib/repo-artifacts";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = loadEscalation(id);

  if (!report) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
