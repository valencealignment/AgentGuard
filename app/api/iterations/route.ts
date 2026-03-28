import { NextResponse } from "next/server";
import { loadIterations } from "@/lib/repo-artifacts";

export async function GET() {
  return NextResponse.json(loadIterations());
}
