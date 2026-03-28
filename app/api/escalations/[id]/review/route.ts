import { NextRequest, NextResponse } from "next/server";
import { updateEscalationStatus } from "@/lib/mock-escalations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = typeof body?.action === "string" ? body.action : null;
  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "denied";
  const report = updateEscalationStatus(id, status);

  if (!report) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
