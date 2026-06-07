import { Page } from "~/components/page";
import { useRevalidateOnInterval } from "~/hooks/use-revalidate-on-interval";
import { dateFormatter } from "~/lib/date-formatter";
import type { Route } from "../../routes/dashboard/+types/route";
import { AttentionList } from "./components/attention-list";
import { CostBreakdownDonut } from "./components/cost-breakdown-donut";
import { DailyCostChart } from "./components/daily-cost-chart";
import { HeroKPIs } from "./components/hero-kpis";
import { MonthlyTrendChart } from "./components/monthly-trend-chart";
import { useCostBreakdown } from "./hooks/use-cost-breakdown";
import { useDailyCost } from "./hooks/use-daily-cost";
import { useFleetKPIs } from "./hooks/use-fleet-kpis";
import { useMonthlyTrend } from "./hooks/use-monthly-trend";
import { useNeedsAttention } from "./hooks/use-needs-attention";

interface DashboardProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export function Dashboard({ loaderData }: DashboardProps) {
  const kpiConfigs = useFleetKPIs(loaderData.kpis);
  const attention = useNeedsAttention(loaderData.attention);
  const dailyCost = useDailyCost(loaderData.trends);
  const costBreakdown = useCostBreakdown(loaderData.trends);
  const monthlyTrend = useMonthlyTrend(loaderData.trends);

  useRevalidateOnInterval(60_000);

  return (
    <Page.Root>
      <Page.Header
        title="Dashboard"
        subtitle={
          <>
            Dane na:{" "}
            <time dateTime={loaderData.generatedAt}>
              {dateFormatter.format(new Date(loaderData.generatedAt))}
            </time>
          </>
        }
      />
      <Page.Body>
        <HeroKPIs configs={kpiConfigs} />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_2fr]">
          <AttentionList state={attention} generatedAt={loaderData.generatedAt} />
          <div className="space-y-3">
            <DailyCostChart state={dailyCost} />
            <CostBreakdownDonut state={costBreakdown} />
          </div>
          <MonthlyTrendChart state={monthlyTrend} className="xl:col-span-2" />
        </div>
      </Page.Body>
    </Page.Root>
  );
}
