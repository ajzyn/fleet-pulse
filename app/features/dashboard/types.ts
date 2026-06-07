import type { DeltaBadgeProps } from "./components/delta-badge";
import type { AttentionStatus, ChipKind } from "./server/attention/types";
import type { CostBreakdownCategory } from "./server/trends/types";

export type KPICardState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string }
  | {
      status: "success";
      value: string;
      subtitle?: string;
      delta?: DeltaBadgeProps;
      sparkline?: number[];
    };

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

export type AttentionListState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string; onRefresh: () => Promise<void> }
  | {
      status: "success";
      items: AttentionItemView[];
      totalCount: number;
      hasOverflow: boolean;
      onRefresh: () => Promise<void>;
    };

export interface DailyCostPointView {
  date: string;
  label: string;
  fuel: number;
  maintenance: number;
}

export type DailyCostChartState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string; onRefresh: () => Promise<void> }
  | {
      status: "success";
      points: DailyCostPointView[];
      onRefresh: () => Promise<void>;
    };

export interface CostBreakdownSliceView {
  category: CostBreakdownCategory;
  label: string;
  color: string;
  amount: number;
  percentage: number;
}

export type CostBreakdownDonutState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string; onRefresh: () => Promise<void> }
  | {
      status: "success";
      slices: CostBreakdownSliceView[];
      total: number;
      onRefresh: () => Promise<void>;
    };

export interface MonthlyTrendPointView {
  month: string;
  label: string;
  fuel: number;
  maintenance: number;
  utilization: number;
}

export type MonthlyTrendChartState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string; onRefresh: () => Promise<void> }
  | {
      status: "success";
      points: MonthlyTrendPointView[];
      onRefresh: () => Promise<void>;
    };
