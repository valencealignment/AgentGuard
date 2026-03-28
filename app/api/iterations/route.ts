import { NextResponse } from "next/server";
import { getIterations } from "@/lib/mock-iterations";

export async function GET() {
  // TODO: return fetch("http://localhost:8002/iterations")
  const iterations = getIterations();
  return NextResponse.json(iterations);
}
