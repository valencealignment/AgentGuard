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
  },
  {
    id: "iter-1",
    label: "iter-1",
    score: 71,
    delta: 9,
    mutation: "Reweighted typosquat distance",
    timestamp: "2026-03-28T11:15:00Z",
  },
  {
    id: "iter-2",
    label: "iter-2",
    score: 78,
    delta: 7,
    mutation: "Added slopsquat detector",
    timestamp: "2026-03-28T12:30:00Z",
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
    // With only 1 point, sparkline renders a div placeholder, no SVG polyline
    expect(container.querySelector("polyline")).not.toBeInTheDocument();
  });
});
