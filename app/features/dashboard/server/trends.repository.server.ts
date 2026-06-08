import {
  getCostBreakdownMtd,
  type CostBreakdownSlice,
} from "./trends/costs-breakdown.repository.server";
import { getDailyCost30d, type DailyCostPoint } from "./trends/daily-cost.repository.server";
import {
  getMonthlyTrend12m,
  type MonthlyTrendPoint,
} from "./trends/monthly-trend.repository.server";

export interface DashboardTrends {
  costBreakdown: CostBreakdownSlice[];
  dailyCost: DailyCostPoint[];
  monthlyTrend: MonthlyTrendPoint[];
}

export const getTrends = async (): Promise<DashboardTrends> => {
  const [costBreakdown, dailyCost, monthlyTrend] = await Promise.all([
    getCostBreakdownMtd(),
    getDailyCost30d(),
    getMonthlyTrend12m(),
  ]);

  return {
    costBreakdown,
    dailyCost,
    monthlyTrend,
  };
};
