import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { DeltaBadge } from "./delta-badge";

const renderInTheme = (ui: ReactElement) => render(<Theme>{ui}</Theme>);

describe("DeltaBadge", () => {
  it("reads a positive change in the good direction as positive sentiment", () => {
    renderInTheme(<DeltaBadge value={0.05} format="percent" goodDirection="up" />);
    expect(screen.getByLabelText(/wzrost.*pozytywny/)).toBeInTheDocument();
  });

  it("reads a drop in the good direction as negative sentiment", () => {
    renderInTheme(<DeltaBadge value={-0.05} format="percent" goodDirection="up" />);
    expect(screen.getByLabelText(/spadek.*negatywny/)).toBeInTheDocument();
  });

  it("flips sentiment when down is the good direction (e.g. cost per km)", () => {
    renderInTheme(<DeltaBadge value={0.05} format="percent" goodDirection="down" />);
    expect(screen.getByLabelText(/wzrost.*negatywny/)).toBeInTheDocument();
  });

  it("treats a zero change as neutral", () => {
    renderInTheme(<DeltaBadge value={0} format="absolute" unit="aut" goodDirection="up" />);
    expect(screen.getByLabelText(/brak zmian.*neutralny/)).toBeInTheDocument();
  });

  it("formats an absolute value with its unit and a sign", () => {
    renderInTheme(<DeltaBadge value={-4} format="absolute" unit="aut" goodDirection="up" />);
    expect(screen.getByText(/-4\s*aut/)).toBeInTheDocument();
  });
});
