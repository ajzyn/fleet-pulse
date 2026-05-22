import { getCostBreakdownMtd, type CostBreakdownSlice } from "./trends/costs-breakdown";
import { getDailyCost30d, type DailyCostPoint } from "./trends/daily-cost";
import { getMonthlyTrend12m, type MonthlyTrendPoint } from "./trends/monthly-trend";

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
