import type {
  CostBreakdownDonutState,
  DailyCostChartState,
  MonthlyTrendChartState,
} from "../types";
import { CostBreakdownDonut } from "./cost-breakdown-donut";
import { DailyCostChart } from "./daily-cost-chart";
import { MonthlyTrendChart } from "./monthly-trend-chart";

interface TrendsSectionProps {
  dailyCost: DailyCostChartState;
  costBreakdown: CostBreakdownDonutState;
  monthlyTrend: MonthlyTrendChartState;
}

export function TrendsSection({ dailyCost, costBreakdown, monthlyTrend }: TrendsSectionProps) {
  return (
    <div className="space-y-3">
      <DailyCostChart state={dailyCost} />
      <CostBreakdownDonut state={costBreakdown} />
      <MonthlyTrendChart state={monthlyTrend} />
    </div>
  );
}
