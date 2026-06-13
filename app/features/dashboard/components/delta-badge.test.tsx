import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderInTheme } from "~/test/render";
import { DeltaBadge } from "./delta-badge";

afterEach(cleanup);

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

  it("stays neutral sentiment when no direction is good (informational metric)", () => {
    renderInTheme(<DeltaBadge value={0.05} format="percent" goodDirection="neutral" />);
    expect(screen.getByLabelText(/wzrost.*neutralny/)).toBeInTheDocument();
  });

  it("formats an absolute value with its unit and a sign", () => {
    renderInTheme(<DeltaBadge value={-4} format="absolute" unit="aut" goodDirection="up" />);
    expect(screen.getByText(/-4\s*aut/)).toBeInTheDocument();
  });

  it("formats a percent value with a sign", () => {
    renderInTheme(<DeltaBadge value={0.05} format="percent" goodDirection="up" />);
    expect(screen.getByText(/\+5,0\s*%/)).toBeInTheDocument();
  });
});
