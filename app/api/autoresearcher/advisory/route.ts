import { type NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const BLOGS_DIR = join(process.cwd(), "ops", "reports", "blogs");

/** Map advisory slugs to file names in ops/reports/blogs/ */
const ADVISORY_MAP: Record<string, string> = {
  litellm: "litellm-supply-chain-advisory.md",
};

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("target");
  if (!target) {
    return NextResponse.json({ error: "missing ?target= parameter" }, { status: 400 });
  }

  // Normalize: "litellm==1.82.8" → "litellm"
  const slug = target.split("==")[0].toLowerCase().trim();
  const filename = ADVISORY_MAP[slug];

  if (!filename) {
    return NextResponse.json({ error: "No advisory found" }, { status: 404 });
  }

  try {
    const content = await readFile(join(BLOGS_DIR, filename), "utf-8");
    return NextResponse.json({ slug, content });
  } catch {
    return NextResponse.json({ error: "Advisory file not found" }, { status: 404 });
  }
}
