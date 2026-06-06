import { Page } from "~/components/page";
import { dateFormatter } from "~/lib/date-formatter";
import type { Route } from "../../routes/dashboard/+types/route";
import { AttentionList } from "./components/attention-list";
import { HeroKPIs } from "./components/hero-kpis";
import { TrendsSection } from "./components/trends-section";
import { useCostBreakdown } from "./hooks/use-cost-breakdown";
import { useDailyCost } from "./hooks/use-daily-cost";
import { useFleetKPIs } from "./hooks/use-fleet-kpis";
import { useNeedsAttention } from "./hooks/use-needs-attention";

interface DashboardProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export function Dashboard({ loaderData }: DashboardProps) {
  const kpiConfigs = useFleetKPIs(loaderData.kpis);
  const attention = useNeedsAttention(loaderData.attention);
  const dailyCost = useDailyCost(loaderData.trends);
  const costBreakdown = useCostBreakdown(loaderData.trends);

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
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-3">
          <AttentionList state={attention} generatedAt={loaderData.generatedAt} />
          <TrendsSection dailyCost={dailyCost} costBreakdown={costBreakdown} />
        </div>
      </Page.Body>
    </Page.Root>
  );
}
