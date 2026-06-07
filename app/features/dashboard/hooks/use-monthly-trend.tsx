import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useRevalidator } from "react-router";
import type { Route } from "../../../routes/dashboard/+types/route";
import type { MonthlyTrendChartState, MonthlyTrendPointView } from "../types";

type TrendsState = Route.ComponentProps["loaderData"]["trends"];

export const useMonthlyTrend = (trendsState: TrendsState): MonthlyTrendChartState => {
  const { revalidate } = useRevalidator();

  if (trendsState.status === "error") {
    return { status: "error", message: trendsState.message, onRetry: revalidate };
  }

  const points = trendsState.data.monthlyTrend;
  const hasAnyData = points.some(
    (p) => p.fuel > 0 || p.maintenance > 0 || p.utilizationKmPerDay > 0,
  );

  if (!hasAnyData) {
    return {
      status: "empty",
      reason: "Brak danych z ostatnich 12 miesięcy",
      onRefresh: revalidate,
    };
  }

  const pointsView: MonthlyTrendPointView[] = points.map((p) => ({
    month: p.month,
    label: format(new Date(`${p.month}-01`), "LLL yy", { locale: pl }),
    fuel: p.fuel,
    maintenance: p.maintenance,
    utilization: p.utilizationKmPerDay,
  }));

  return {
    status: "success",
    points: pointsView,
    onRefresh: revalidate,
  };
};
