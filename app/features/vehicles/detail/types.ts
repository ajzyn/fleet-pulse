import type { BadgeProps } from "@radix-ui/themes";
import type { AsyncViewState } from "~/components/feedback/async-view";

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

export type VehicleTimelineState = AsyncViewState<{
  events: TimelineEventView[];
  total: number;
  shownCount: number;
}>;
