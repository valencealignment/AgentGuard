import { NextResponse } from "next/server";
import { runNextIteration } from "@/lib/mock-iterations";

export async function POST() {
  const iteration = runNextIteration();
  return NextResponse.json(iteration);
}
