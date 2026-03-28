import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import {
  transformScenarioReport,
  type ScenarioReport,
} from "@/lib/scenario-transforms";

const REPORTS_DIR = join(process.cwd(), "ops", "reports", "demo");

async function loadScenarioReports(): Promise<ScenarioReport[]> {
  const entries = await readdir(REPORTS_DIR, { withFileTypes: true });
  const reports: ScenarioReport[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("scenario-")) continue;
    try {
      const raw = await readFile(
        join(REPORTS_DIR, entry.name, "report.json"),
        "utf-8",
      );
      reports.push(JSON.parse(raw) as ScenarioReport);
    } catch {
      // Skip scenarios without valid report.json
    }
  }

  return reports;
}

export async function GET() {
  const reports = await loadScenarioReports();
  const decisions = reports.map(transformScenarioReport);
  return NextResponse.json(decisions);
}
