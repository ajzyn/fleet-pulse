import type { DailyCostChartState } from "../types";
import { DailyCostChart } from "./daily-cost-chart";

interface TrendsSectionProps {
  dailyCost: DailyCostChartState;
}

export function TrendsSection({ dailyCost }: TrendsSectionProps) {
  return (
    <div className="space-y-3">
      <DailyCostChart state={dailyCost} />
    </div>
  );
}
