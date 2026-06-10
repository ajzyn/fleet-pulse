import {
  differenceInCalendarDays,
  format,
  max as maxDate,
  startOfMonth,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { useRevalidator } from "react-router";
import { plnFormatter } from "~/lib/number-formatter";
import type { LoaderState } from "~/lib/server/loader";
import type { VehicleMonthlyStatsPoint } from "../server/vehicle-stats.repository.server";
import type {
  CostPointView,
  EfficiencyPointView,
  MileagePointView,
  VehicleStatsState,
} from "../types";

const MONTHS_IN_WINDOW = 12;

const oneDecimalFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

const activeDaysInWindow = (purchaseDate: string): number => {
  const today = new Date();
  const windowStart = startOfMonth(subMonths(today, MONTHS_IN_WINDOW - 1));
  const effectiveStart = maxDate([windowStart, new Date(purchaseDate)]);
  return Math.max(1, differenceInCalendarDays(today, effectiveStart) + 1);
};

const monthLabel = (monthKey: string) =>
  format(new Date(`${monthKey}-01`), "LLL yy", { locale: pl });

const buildMileageViews = (points: VehicleMonthlyStatsPoint[]): MileagePointView[] => {
  const result: MileagePointView[] = [];
  let lastOdometer: number | null = null;
  for (const p of points) {
    if (p.odometerKm !== null) lastOdometer = p.odometerKm;
    result.push({ month: p.month, label: monthLabel(p.month), odometerKm: lastOdometer });
  }
  return result;
};

export const useVehicleStats = (
  state: LoaderState<VehicleMonthlyStatsPoint[]>,
  purchaseDate: string,
): VehicleStatsState => {
  const { revalidate } = useRevalidator();

  if (state.status === "error") {
    return { status: "error", message: state.message, onRetry: revalidate };
  }

  const points = state.data;
  const hasAnyData = points.some(
    (p) => p.fuelCost > 0 || p.maintenanceCost > 0 || p.distanceKm > 0,
  );

  if (!hasAnyData) {
    return { status: "empty", reason: "Brak danych analitycznych dla tego pojazdu" };
  }

  const mileage = buildMileageViews(points);

  const costs: CostPointView[] = points.map((p) => ({
    month: p.month,
    label: monthLabel(p.month),
    fuel: p.fuelCost,
    maintenance: p.maintenanceCost,
  }));

  const efficiency: EfficiencyPointView[] = points.map((p) => ({
    month: p.month,
    label: monthLabel(p.month),
    lPer100: p.distanceKm > 0 && p.liters > 0 ? (p.liters / p.distanceKm) * 100 : null,
  }));
  const hasEfficiency = efficiency.some((e) => e.lPer100 !== null);

  const totals = points.reduce(
    (acc, p) => ({
      cost: acc.cost + p.fuelCost + p.maintenanceCost,
      liters: acc.liters + p.liters,
      distance: acc.distance + p.distanceKm,
    }),
    { cost: 0, liters: 0, distance: 0 },
  );

  const avgEfficiency =
    totals.distance > 0 && totals.liters > 0 ? (totals.liters / totals.distance) * 100 : null;

  return {
    status: "success",
    kpis: {
      totalCost: plnFormatter.format(totals.cost),
      avgEfficiency:
        avgEfficiency === null ? "—" : `${oneDecimalFormatter.format(avgEfficiency)} l/100 km`,
      avgKmPerDay: `${oneDecimalFormatter.format(totals.distance / activeDaysInWindow(purchaseDate))} km`,
    },
    mileage,
    costs,
    efficiency,
    hasEfficiency,
  };
};
