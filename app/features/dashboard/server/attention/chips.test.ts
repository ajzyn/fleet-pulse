import { describe, expect, it } from "vitest";
import { collectChips, computeSeverityScore } from "./chips";
import type { AttentionRow } from "./types";

const NOW = new Date("2026-06-07T12:00:00Z");
const NOW_MS = NOW.getTime();
const daysAgo = (days: number) => new Date(NOW_MS - days * 24 * 60 * 60 * 1000);

const healthyRow = (overrides: Partial<AttentionRow> = {}): AttentionRow => ({
  vehicleId: "v1",
  plateNumber: "WX 12345",
  make: "Toyota",
  model: "Corolla",
  status: "active",
  isServiceOverdue: false,
  isServiceDueSoon: false,
  lastStartedAt: NOW,
  recentFuelLiters: 0,
  recentDistanceKm: 0,
  recentFuelCost: 0,
  recentMaintenanceCost: 0,
  baselineFuelAvg: null,
  baselineFuelStddev: null,
  baselineFuelSamples: null,
  baselineFuelCostAvg: null,
  baselineFuelCostStddev: null,
  baselineFuelCostSamples: null,
  baselineMaintenanceCostAvg: null,
  baselineMaintenanceCostStddev: null,
  baselineMaintenanceCostSamples: null,
  ...overrides,
});

describe("collectChips", () => {
  it("returns no chips for a healthy vehicle", () => {
    expect(collectChips(healthyRow(), NOW_MS)).toEqual([]);
  });

  describe("maintenance flags", () => {
    it("flags overdue maintenance", () => {
      expect(collectChips(healthyRow({ isServiceOverdue: true }), NOW_MS)).toContain(
        "overdue_maintenance",
      );
    });

    it("flags due-soon maintenance", () => {
      expect(collectChips(healthyRow({ isServiceDueSoon: true }), NOW_MS)).toContain(
        "maintenance_due_soon",
      );
    });

    it("treats overdue and due-soon as mutually exclusive, preferring overdue", () => {
      const chips = collectChips(
        healthyRow({ isServiceOverdue: true, isServiceDueSoon: true }),
        NOW_MS,
      );
      expect(chips).toContain("overdue_maintenance");
      expect(chips).not.toContain("maintenance_due_soon");
    });
  });

  describe("idle detection", () => {
    it("flags a vehicle idle for more than 14 days", () => {
      expect(collectChips(healthyRow({ lastStartedAt: daysAgo(20) }), NOW_MS)).toContain(
        "idle_too_long",
      );
    });

    it("flags a vehicle that never started", () => {
      expect(collectChips(healthyRow({ lastStartedAt: null }), NOW_MS)).toContain("idle_too_long");
    });

    it("does not flag a vehicle driven within 14 days", () => {
      expect(collectChips(healthyRow({ lastStartedAt: daysAgo(10) }), NOW_MS)).not.toContain(
        "idle_too_long",
      );
    });
  });

  describe("fuel anomaly (2σ from baseline efficiency)", () => {
    const withFuelBaseline = (overrides: Partial<AttentionRow>) =>
      healthyRow({
        baselineFuelAvg: 8,
        baselineFuelStddev: 1,
        baselineFuelSamples: 4,
        recentDistanceKm: 1000,
        ...overrides,
      });

    it("flags efficiency deviating more than 2σ", () => {
      expect(collectChips(withFuelBaseline({ recentFuelLiters: 110 }), NOW_MS)).toContain(
        "fuel_anomaly",
      );
    });

    it("does not flag efficiency within 2σ", () => {
      expect(collectChips(withFuelBaseline({ recentFuelLiters: 95 }), NOW_MS)).not.toContain(
        "fuel_anomaly",
      );
    });

    it("does not flag efficiency sitting exactly on the 2σ boundary", () => {
      expect(collectChips(withFuelBaseline({ recentFuelLiters: 100 }), NOW_MS)).not.toContain(
        "fuel_anomaly",
      );
    });

    it("does not flag when historical variance is zero", () => {
      expect(
        collectChips(withFuelBaseline({ recentFuelLiters: 200, baselineFuelStddev: 0 }), NOW_MS),
      ).not.toContain("fuel_anomaly");
    });

    it("does not flag when baseline has too few samples", () => {
      expect(
        collectChips(withFuelBaseline({ recentFuelLiters: 110, baselineFuelSamples: 3 }), NOW_MS),
      ).not.toContain("fuel_anomaly");
    });

    it("does not flag when there is no recent distance", () => {
      expect(
        collectChips(withFuelBaseline({ recentFuelLiters: 110, recentDistanceKm: 0 }), NOW_MS),
      ).not.toContain("fuel_anomaly");
    });
  });

  describe("cost anomaly (2σ from baseline spend)", () => {
    const withCostBaseline = (overrides: Partial<AttentionRow>) =>
      healthyRow({
        baselineFuelCostAvg: 100,
        baselineFuelCostStddev: 10,
        baselineFuelCostSamples: 4,
        ...overrides,
      });

    it("flags spend deviating more than 2σ", () => {
      expect(collectChips(withCostBaseline({ recentFuelCost: 480 }), NOW_MS)).toContain(
        "cost_anomaly",
      );
    });

    it("does not flag spend within 2σ", () => {
      expect(collectChips(withCostBaseline({ recentFuelCost: 450 }), NOW_MS)).not.toContain(
        "cost_anomaly",
      );
    });

    it("does not flag without any cost baseline", () => {
      expect(collectChips(healthyRow({ recentFuelCost: 480 }), NOW_MS)).not.toContain(
        "cost_anomaly",
      );
    });

    it("flags spend using a maintenance-only baseline", () => {
      const row = healthyRow({
        recentMaintenanceCost: 480,
        baselineMaintenanceCostAvg: 100,
        baselineMaintenanceCostStddev: 10,
        baselineMaintenanceCostSamples: 4,
      });
      expect(collectChips(row, NOW_MS)).toContain("cost_anomaly");
    });
  });

  it("returns chips in a stable order when several conditions trigger", () => {
    const row = healthyRow({
      isServiceOverdue: true,
      lastStartedAt: daysAgo(30),
      baselineFuelAvg: 8,
      baselineFuelStddev: 1,
      baselineFuelSamples: 4,
      recentDistanceKm: 1000,
      recentFuelLiters: 110,
      baselineFuelCostAvg: 100,
      baselineFuelCostStddev: 10,
      baselineFuelCostSamples: 4,
      recentFuelCost: 480,
    });
    expect(collectChips(row, NOW_MS)).toEqual([
      "overdue_maintenance",
      "idle_too_long",
      "fuel_anomaly",
      "cost_anomaly",
    ]);
  });
});

describe("computeSeverityScore", () => {
  it("scores an empty list as zero", () => {
    expect(computeSeverityScore([])).toBe(0);
  });

  it("weights overdue maintenance highest among single chips", () => {
    expect(computeSeverityScore(["overdue_maintenance"])).toBe(100);
    expect(computeSeverityScore(["overdue_maintenance"])).toBeGreaterThan(
      computeSeverityScore(["cost_anomaly"]),
    );
    expect(computeSeverityScore(["cost_anomaly"])).toBeGreaterThan(
      computeSeverityScore(["fuel_anomaly"]),
    );
    expect(computeSeverityScore(["fuel_anomaly"])).toBeGreaterThan(
      computeSeverityScore(["maintenance_due_soon"]),
    );
    expect(computeSeverityScore(["maintenance_due_soon"])).toBeGreaterThan(
      computeSeverityScore(["idle_too_long"]),
    );
  });

  it("sums the weights of all chips", () => {
    expect(computeSeverityScore(["overdue_maintenance", "cost_anomaly", "idle_too_long"])).toBe(
      190,
    );
  });
});
