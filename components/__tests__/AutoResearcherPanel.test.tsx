import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AutoResearcherPanel from "../dashboard/AutoResearcherPanel";
import type { Iteration, ScoreResponse } from "@/lib/types";

const mockScore: ScoreResponse = {
  policy_score: 85,
  catch_rate: 0.9,
  fp_rate: 0.04,
  total_evaluated: 20,
  total_blocked: 12,
  total_allowed: 6,
  total_escalated: 2,
};

const mockIterations: Iteration[] = [
  {
    id: "iter-baseline",
    label: "baseline",
    score: 62,
    delta: 0,
    mutation: "Initial rule set",
    timestamp: "2026-03-28T10:00:00Z",
    kept: true,
  },
  {
    id: "iter-1",
    label: "iter-1",
    score: 71,
    delta: 9,
    mutation: "Reweighted typosquat distance",
    timestamp: "2026-03-28T11:15:00Z",
    kept: true,
  },
  {
    id: "iter-2",
    label: "iter-2",
    score: 78,
    delta: 7,
    mutation: "Added slopsquat detector",
    timestamp: "2026-03-28T12:30:00Z",
    kept: true,
  },
];

const mockIterationsWithRollback: Iteration[] = [
  ...mockIterations,
  {
    id: "iter-2b",
    label: "iter-2b",
    score: 74,
    delta: -4,
    mutation: "Aggressive namespace-collision heuristic",
    timestamp: "2026-03-28T12:48:00Z",
    kept: false,
  },
  {
    id: "iter-3",
    label: "iter-3",
    score: 85,
    delta: 7,
    mutation: "Combined MCP auth-bypass signals",
    timestamp: "2026-03-28T13:45:00Z",
    kept: true,
  },
];

describe("AutoResearcherPanel", () => {
  it("displays the policy score", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Policy Score")).toBeInTheDocument();
  });

  it("shows dashes when score is null", () => {
    render(<AutoResearcherPanel score={null} iterations={[]} />);
    // Policy score + 2 stat cards all show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(3);
  });

  it("displays catch rate and FP rate as percentages", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("4%")).toBeInTheDocument();
  });

  it("renders iteration rows with labels and scores", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    expect(screen.getByText("baseline")).toBeInTheDocument();
    expect(screen.getByText("iter-1")).toBeInTheDocument();
    expect(screen.getByText("iter-2")).toBeInTheDocument();
  });

  it("shows positive delta with + prefix", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    expect(screen.getByText("+9")).toBeInTheDocument();
    expect(screen.getByText("+7")).toBeInTheDocument();
  });

  it("does not show delta for zero delta (baseline)", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    // baseline delta is 0, should not render "+0"
    expect(screen.queryByText("+0")).not.toBeInTheDocument();
  });

  it("calls onRunIteration when button is clicked", () => {
    const handler = vi.fn();
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
        onRunIteration={handler}
      />,
    );
    fireEvent.click(screen.getByText("Run Iteration"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("disables button and shows running text when isRunning", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
        isRunning={true}
      />,
    );
    const button = screen.getByText("Running…");
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("renders sparkline SVG when >= 2 points", () => {
    const { container } = render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterations}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg!.querySelector("polyline")).toBeInTheDocument();
  });

  it("renders placeholder div for sparkline when < 2 points", () => {
    const { container } = render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={[mockIterations[0]]}
      />,
    );
    // With only 1 point, score sparkline renders a placeholder div (no polyline).
    // The training card's loss sparkline still renders its own polyline,
    // so we expect exactly 1 polyline (loss) instead of 2 (loss + score).
    const polylines = container.querySelectorAll("polyline");
    expect(polylines.length).toBe(1);
  });

  // ── Rolled-back iteration tests ─────────────────────────────

  it("shows rolled back label for reverted iterations", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterationsWithRollback}
      />,
    );
    expect(screen.getByText("rolled back", { exact: false })).toBeInTheDocument();
  });

  it("shows negative delta for rolled-back iterations", () => {
    render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterationsWithRollback}
      />,
    );
    expect(screen.getByText("-4")).toBeInTheDocument();
  });

  it("excludes rolled-back iterations from sparkline points", () => {
    const { container } = render(
      <AutoResearcherPanel
        score={mockScore}
        iterations={mockIterationsWithRollback}
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const polyline = svg!.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
    // 4 kept iterations = 4 points in polyline (baseline, iter-1, iter-2, iter-3)
    const pointsAttr = polyline!.getAttribute("points")!;
    const pointCount = pointsAttr.split(" ").length;
    expect(pointCount).toBe(4);
  });
});
