import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignalChip } from "../dashboard/SignalChip";

describe("SignalChip", () => {
  it("replaces underscores with spaces in the label", () => {
    render(<SignalChip signal="reads_ssh_keys" />);
    expect(screen.getByText("reads ssh keys")).toBeInTheDocument();
  });

  it("applies critical category colors for known critical signals", () => {
    const { container } = render(<SignalChip signal="known_malicious" />);
    const chip = container.querySelector("span")!;
    expect(chip.className).toContain("text-signal-critical");
  });

  it("applies warning category colors for known warning signals", () => {
    const { container } = render(<SignalChip signal="low_download_count" />);
    const chip = container.querySelector("span")!;
    expect(chip.className).toContain("text-signal-warning");
  });

  it("applies info category colors for known info signals", () => {
    const { container } = render(<SignalChip signal="first_seen" />);
    const chip = container.querySelector("span")!;
    expect(chip.className).toContain("text-signal-info");
  });

  it("defaults to info for unknown signals", () => {
    const { container } = render(<SignalChip signal="something_unknown" />);
    const chip = container.querySelector("span")!;
    expect(chip.className).toContain("text-signal-info");
  });
});
