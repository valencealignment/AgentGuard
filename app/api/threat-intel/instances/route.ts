import { NextResponse } from "next/server";
import { GOLDEN_INSTANCES } from "@/lib/golden-dataset";

export async function GET() {
  return NextResponse.json(GOLDEN_INSTANCES);
}
