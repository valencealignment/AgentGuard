import { NextResponse } from "next/server";
import { loadScore } from "@/lib/repo-artifacts";

export async function GET() {
  return NextResponse.json(loadScore());
}
