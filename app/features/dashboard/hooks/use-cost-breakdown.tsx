import { useRevalidator } from "react-router";
import type { Route } from "../../../routes/dashboard/+types/route";
import type { CostBreakdownCategory } from "../server/trends/types";
import type { CostBreakdownDonutState, CostBreakdownSliceView } from "../types";

type TrendsState = Route.ComponentProps["loaderData"]["trends"];

const CATEGORY_META: Record<CostBreakdownCategory, { label: string; color: string }> = {
  fuel: { label: "Paliwo", color: "var(--orange-9)" },
  maintenance_planned: { label: "Serwis planowy", color: "var(--blue-9)" },
  maintenance_unplanned: { label: "Serwis awaryjny", color: "var(--crimson-9)" },
};

export const useCostBreakdown = (trendsState: TrendsState): CostBreakdownDonutState => {
  const { revalidate } = useRevalidator();

  if (trendsState.status === "error") {
    return { status: "error", message: trendsState.message, onRetry: revalidate };
  }

  const slices = trendsState.data.costBreakdown;
  const total = slices.reduce((acc, s) => acc + s.amount, 0);

  if (total === 0) {
    return {
      status: "empty",
      reason: "Brak kosztów w tym miesiącu",
    };
  }

  const slicesView: CostBreakdownSliceView[] = slices
    .filter((s) => s.amount > 0)
    .map((s) => ({
      category: s.category,
      label: CATEGORY_META[s.category].label,
      color: CATEGORY_META[s.category].color,
      amount: s.amount,
      percentage: s.percentage,
    }));

  return {
    status: "success",
    slices: slicesView,
    total,
  };
};
