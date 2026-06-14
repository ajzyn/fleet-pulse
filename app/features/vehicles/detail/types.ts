import type { BadgeProps } from "@radix-ui/themes";
import type { DataViewState } from "~/components/feedback/data-view";

export interface VehicleHeaderView {
  title: string;
  vin: string;
  year: number;
  fuelLabel: string;
  mileage: string;
  lastService: string;
  driver: string;
  purchaseDate: string;
  purchasePrice: string;
}

export interface TimelineEventView {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
  mileageLabel: string;
  costLabel: string | null;
  dotColor: string;
  statusBadge: { label: string; color: NonNullable<BadgeProps["color"]> } | null;
}

export type VehicleTimelineState = DataViewState<{
  events: TimelineEventView[];
  total: number;
  shownCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  onRetryLoadMore: () => void;
}>;

export interface MileagePointView {
  month: string;
  label: string;
  odometerKm: number | null;
}

export interface CostPointView {
  month: string;
  label: string;
  fuel: number;
  maintenance: number;
}

export interface EfficiencyPointView {
  month: string;
  label: string;
  lPer100: number | null;
}

export interface VehicleStatsKpisView {
  totalCost: string;
  avgEfficiency: string;
  avgKmPerDay: string;
}

export type VehicleStatsState = DataViewState<{
  kpis: VehicleStatsKpisView;
  mileage: MileagePointView[];
  costs: CostPointView[];
  efficiency: EfficiencyPointView[];
  hasEfficiency: boolean;
}>;
