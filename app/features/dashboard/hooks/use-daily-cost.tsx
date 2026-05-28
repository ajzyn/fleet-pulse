import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useRevalidator } from "react-router";
import type { Route } from "../../../routes/dashboard/+types/route";
import type { DailyCostChartState, DailyCostPointView } from "../types";

type TrendsState = Route.ComponentProps["loaderData"]["trends"];

export const useDailyCost = (trendsState: TrendsState): DailyCostChartState => {
  const { revalidate } = useRevalidator();

  if (trendsState.status === "error") {
    return { status: "error", message: trendsState.message, onRetry: revalidate };
  }

  const points = trendsState.data.dailyCost;
  const hasAnyCosts = points.some((p) => p.fuel > 0 || p.maintenance > 0);

  if (!hasAnyCosts) {
    return {
      status: "empty",
      reason: "Brak kosztów w ostatnich 30 dniach",
      onRefresh: revalidate,
    };
  }

  const pointsView: DailyCostPointView[] = points.map((p) => ({
    date: p.date,
    label: format(new Date(p.date), "d MMM", { locale: pl }),
    fuel: p.fuel,
    maintenance: p.maintenance,
  }));

  return {
    status: "success",
    points: pointsView,
    onRefresh: revalidate,
  };
};
