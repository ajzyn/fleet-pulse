import type { AsyncViewState } from "~/components/feedback/async-view";
import type { DeltaBadgeProps } from "./components/delta-badge";
import type { AttentionStatus, ChipKind } from "./server/attention/types";
import type { CostBreakdownCategory } from "./server/trends/types";

export type KPICardState = AsyncViewState<{
  value: string;
  subtitle?: string;
  delta?: DeltaBadgeProps;
  sparkline?: number[];
}>;

export interface KpiCardConfig {
  key: string;
  title: string;
  href: string;
  state: KPICardState;
}

export type ChipTone = "critical" | "warning" | "caution" | "info";

export interface AttentionChipView {
  kind: ChipKind;
  tone: ChipTone;
  label: string;
}

export interface AttentionItemView {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  status: Exclude<AttentionStatus, "retired">;
  chips: AttentionChipView[];
  topTone: ChipTone;
  href: string;
}

export type AttentionListState = AsyncViewState<{
  items: AttentionItemView[];
  totalCount: number;
  hasOverflow: boolean;
}>;

export interface DailyCostPointView {
  date: string;
  label: string;
  fuel: number;
  maintenance: number;
}

export type DailyCostChartState = AsyncViewState<{
  points: DailyCostPointView[];
}>;

export interface CostBreakdownSliceView {
  category: CostBreakdownCategory;
  label: string;
  color: string;
  amount: number;
  percentage: number;
}

export type CostBreakdownDonutState = AsyncViewState<{
  slices: CostBreakdownSliceView[];
  total: number;
}>;

export interface MonthlyTrendPointView {
  month: string;
  label: string;
  fuel: number;
  maintenance: number;
  utilization: number;
}

export type MonthlyTrendChartState = AsyncViewState<{
  points: MonthlyTrendPointView[];
}>;
