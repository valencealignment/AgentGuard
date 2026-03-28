import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DecisionDetail from "../dashboard/DecisionDetail";
import type { Decision } from "@/lib/types";

const baseDecision: Decision = {
  id: "test-1",
  timestamp: "2026-03-28T09:14:33Z",
  action_type: "package_install",
  target: "test-package==1.0.0",
  agent_id: "test-agent",
  verdict: "BLOCK",
  confidence: 0.95,
  rules_triggered: ["test-rule"],
  signals: ["reads_ssh_keys"],
  reason: "test reason",
  provenance: "test provenance",
  thread_id: "thread-1",
  duration_ms: 100,
  is_real_attack: false,
};

describe("DecisionDetail", () => {
  it("shows placeholder when no decision selected", () => {
    render(<DecisionDetail decision={null} />);
    expect(screen.getByText("Select an entry to view details")).toBeInTheDocument();
  });

  it("renders decision target", () => {
    render(<DecisionDetail decision={baseDecision} />);
    expect(screen.getByText("test-package==1.0.0")).toBeInTheDocument();
  });

  it("renders signals", () => {
    render(<DecisionDetail decision={baseDecision} />);
    // SignalChip replaces underscores with spaces
    expect(screen.getByText("reads ssh keys")).toBeInTheDocument();
  });

  it("does not render advisory section when advisory_md is absent", () => {
    render(<DecisionDetail decision={baseDecision} />);
    expect(screen.queryByText("Agent-Generated Advisory")).not.toBeInTheDocument();
  });

  it("renders advisory section when advisory_md is present", () => {
    const decisionWithAdvisory: Decision = {
      ...baseDecision,
      advisory_md: `# Test Advisory

## Summary

This is a test advisory.

## Observed Behaviors

- Reads SSH keys.
- Reads environment variables.`,
    };
    render(<DecisionDetail decision={decisionWithAdvisory} />);
    expect(screen.getByText("Agent-Generated Advisory")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
  });

  it("renders advisory markdown headings", () => {
    const decisionWithAdvisory: Decision = {
      ...baseDecision,
      advisory_md: `# Title

## Summary

Some summary text.

## Recommendations

- Do this.
- Do that.`,
    };
    render(<DecisionDetail decision={decisionWithAdvisory} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Recommendations")).toBeInTheDocument();
  });

  it("renders advisory list items", () => {
    const decisionWithAdvisory: Decision = {
      ...baseDecision,
      advisory_md: `# Title

## Actions

- Freeze dependencies.
- Rotate credentials.`,
    };
    render(<DecisionDetail decision={decisionWithAdvisory} />);
    expect(screen.getByText("Freeze dependencies.")).toBeInTheDocument();
    expect(screen.getByText("Rotate credentials.")).toBeInTheDocument();
  });

  it("renders real attack callout for is_real_attack decisions", () => {
    const realAttack: Decision = {
      ...baseDecision,
      is_real_attack: true,
    };
    render(<DecisionDetail decision={realAttack} />);
    expect(screen.getByText("Confirmed Real Attack")).toBeInTheDocument();
  });
});
