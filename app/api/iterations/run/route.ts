import { NextResponse } from "next/server";
import { previewNextIteration } from "@/lib/repo-artifacts";

export async function POST() {
  // This branch is wired to checked-in hackathon artifacts, so the "run" action
  // returns a preview iteration instead of mutating repository state on the server.
  return NextResponse.json(previewNextIteration());
}
