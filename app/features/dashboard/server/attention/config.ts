import type { ChipKind } from "./types";

export const RECENT_WINDOW_DAYS = 30;
export const BASELINE_WINDOW_DAYS = 90;
export const IDLE_THRESHOLD_DAYS = 14;
export const DUE_SOON_THRESHOLD_DAYS = 7;
export const SERVICE_INTERVAL_MONTHS = 12;
export const MIN_BASELINE_WEEKS = 4;
export const ANOMALY_SIGMA_THRESHOLD = 2;
export const MAX_ATTENTION_ITEMS = 10;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const DAYS_PER_WEEK = 7;

export const SEVERITY: Record<ChipKind, number> = {
  overdue_maintenance: 100,
  cost_anomaly: 70,
  fuel_anomaly: 50,
  maintenance_due_soon: 30,
  idle_too_long: 20,
};
