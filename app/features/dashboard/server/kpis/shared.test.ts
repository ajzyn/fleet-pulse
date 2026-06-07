import { describe, expect, it } from "vitest";
import { buildRollingSparkline, computeDeltaWithPercentage } from "./shared";

describe("computeDeltaWithPercentage", () => {
  it("reports an increase as a positive delta trending up", () => {
    const delta = computeDeltaWithPercentage(120, 100);
    expect(delta.absolute).toBe(20);
    expect(delta.percentage).toBeCloseTo(20);
    expect(delta.direction).toBe("up");
  });

  it("reports a decrease as a negative delta trending down", () => {
    const delta = computeDeltaWithPercentage(80, 100);
    expect(delta.absolute).toBe(-20);
    expect(delta.percentage).toBeCloseTo(-20);
    expect(delta.direction).toBe("down");
  });

  it("treats a sub-1% change as flat to avoid noisy badges", () => {
    expect(computeDeltaWithPercentage(100.5, 100).direction).toBe("flat");
    expect(computeDeltaWithPercentage(99.5, 100).direction).toBe("flat");
  });

  it("does not divide by zero when there is no prior value", () => {
    const delta = computeDeltaWithPercentage(50, 0);
    expect(delta.absolute).toBe(50);
    expect(delta.percentage).toBe(0);
    expect(delta.direction).toBe("flat");
  });
});

describe("buildRollingSparkline", () => {
  const TODAY = new Date("2026-06-07T12:00:00Z");

  it("produces one point per day in chronological order (oldest first)", () => {
    const series = buildRollingSparkline(3, (key) => key.length, TODAY);
    expect(series).toHaveLength(3);
  });

  it("maps each day to its keyed value", () => {
    const valueByDay: Record<string, number> = {
      "2026-06-05": 5,
      "2026-06-06": 6,
      "2026-06-07": 7,
    };
    const series = buildRollingSparkline(3, (key) => valueByDay[key] ?? 0, TODAY);
    expect(series).toEqual([5, 6, 7]);
  });

  it("falls back to the provided default for days without data", () => {
    const series = buildRollingSparkline(3, (key) => (key === "2026-06-07" ? 9 : 0), TODAY);
    expect(series).toEqual([0, 0, 9]);
  });
});
