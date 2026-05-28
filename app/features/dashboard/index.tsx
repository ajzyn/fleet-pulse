import { Page } from "~/components/page";
import { dateFormatter } from "~/lib/date-formatter";
import type { Route } from "../../routes/dashboard/+types/route";
import { AttentionList } from "./components/attention-list";
import { HeroKPIs } from "./components/hero-kpis";
import { useFleetKPIs } from "./hooks/use-fleet-kpis";
import { useNeedsAttention } from "./hooks/use-needs-attention";

interface DashboardProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export function Dashboard({ loaderData }: DashboardProps) {
  const kpiConfigs = useFleetKPIs(loaderData.kpis);
  const attention = useNeedsAttention(loaderData.attention);

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
        <AttentionList state={attention} generatedAt={loaderData.generatedAt} />
      </Page.Body>
    </Page.Root>
  );
}
