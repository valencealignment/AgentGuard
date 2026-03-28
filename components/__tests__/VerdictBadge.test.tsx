import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerdictBadge } from "../dashboard/VerdictBadge";
import type { Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["BLOCK", "ALLOW", "ESCALATE", "WARN"];

describe("VerdictBadge", () => {
  it.each(VERDICTS)("renders the %s verdict text", (verdict) => {
    render(<VerdictBadge verdict={verdict} />);
    expect(screen.getByText(verdict)).toBeInTheDocument();
  });

  it("applies verdict-specific color classes", () => {
    const { container } = render(<VerdictBadge verdict="BLOCK" />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("text-verdict-block");
    expect(badge.className).toContain("bg-verdict-block/15");
  });

  it("renders as an inline span with pill styling", () => {
    const { container } = render(<VerdictBadge verdict="ALLOW" />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain("uppercase");
  });
});
