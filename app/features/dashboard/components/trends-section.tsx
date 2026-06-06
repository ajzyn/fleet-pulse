import type { CostBreakdownDonutState, DailyCostChartState } from "../types";
import { CostBreakdownDonut } from "./cost-breakdown-donut";
import { DailyCostChart } from "./daily-cost-chart";

interface TrendsSectionProps {
  dailyCost: DailyCostChartState;
  costBreakdown: CostBreakdownDonutState;
}

export function TrendsSection({ dailyCost, costBreakdown }: TrendsSectionProps) {
  return (
    <div className="space-y-3">
      <DailyCostChart state={dailyCost} />
      <CostBreakdownDonut state={costBreakdown} />
    </div>
  );
}
