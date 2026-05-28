import {
  ANOMALY_SIGMA_THRESHOLD,
  DAYS_PER_WEEK,
  IDLE_THRESHOLD_DAYS,
  MIN_BASELINE_WEEKS,
  MS_PER_DAY,
  RECENT_WINDOW_DAYS,
  SEVERITY,
} from "./config";
import type { AttentionRow, ChipKind } from "./types";

const detectIdle = (row: AttentionRow, nowMs: number): boolean => {
  if (!row.lastStartedAt) return true;
  const daysSinceLastTrip = (nowMs - row.lastStartedAt.getTime()) / MS_PER_DAY;
  return daysSinceLastTrip > IDLE_THRESHOLD_DAYS;
};

const detectFuelAnomaly = (row: AttentionRow): boolean => {
  if (row.recentDistanceKm <= 0) return false;
  if ((row.baselineFuelSamples ?? 0) < MIN_BASELINE_WEEKS) return false;
  if (!row.baselineFuelStddev || row.baselineFuelStddev <= 0) return false;
  if (row.baselineFuelAvg === null) return false;

  const recentFuelEfficiency = (row.recentFuelLiters / row.recentDistanceKm) * 100;
  const deviation = Math.abs(recentFuelEfficiency - row.baselineFuelAvg);
  return deviation > ANOMALY_SIGMA_THRESHOLD * row.baselineFuelStddev;
};

const detectCostAnomaly = (row: AttentionRow): boolean => {
  const recentCost = row.recentFuelCost + row.recentMaintenanceCost;
  if (recentCost <= 0) return false;

  const hasFuelBaseline = (row.baselineFuelCostSamples ?? 0) >= MIN_BASELINE_WEEKS;
  const hasMaintenanceBaseline = (row.baselineMaintenanceCostSamples ?? 0) >= MIN_BASELINE_WEEKS;
  if (!hasFuelBaseline && !hasMaintenanceBaseline) return false;

  const weeks = RECENT_WINDOW_DAYS / DAYS_PER_WEEK;
  const avgFuelCost = hasFuelBaseline ? (row.baselineFuelCostAvg ?? 0) : 0;
  const avgMaintenanceCost = hasMaintenanceBaseline ? (row.baselineMaintenanceCostAvg ?? 0) : 0;
  const varianceFuelCost = hasFuelBaseline ? (row.baselineFuelCostStddev ?? 0) ** 2 : 0;
  const varianceMaintenanceCost = hasMaintenanceBaseline
    ? (row.baselineMaintenanceCostStddev ?? 0) ** 2
    : 0;

  const expectedCost = (avgFuelCost + avgMaintenanceCost) * weeks;
  const expectedStddev = Math.sqrt((varianceFuelCost + varianceMaintenanceCost) * weeks);

  if (expectedStddev <= 0) return false;
  return Math.abs(recentCost - expectedCost) > ANOMALY_SIGMA_THRESHOLD * expectedStddev;
};

export const collectChips = (row: AttentionRow, nowMs: number): ChipKind[] => {
  const chips: ChipKind[] = [];

  if (row.isServiceOverdue) {
    chips.push("overdue_maintenance");
  } else if (row.isServiceDueSoon) {
    chips.push("maintenance_due_soon");
  }

  if (detectIdle(row, nowMs)) chips.push("idle_too_long");
  if (detectFuelAnomaly(row)) chips.push("fuel_anomaly");
  if (detectCostAnomaly(row)) chips.push("cost_anomaly");

  return chips;
};

export const computeSeverityScore = (chips: ChipKind[]): number =>
  chips.reduce((sum, chip) => sum + SEVERITY[chip], 0);
