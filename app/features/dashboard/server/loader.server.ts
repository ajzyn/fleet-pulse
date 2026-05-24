import { settledToLoaderState, type LoaderState } from "~/lib/server/loader";
import { getNeedsAttention } from "./attention.repository.server";
import type { AttentionItem } from "./attention/config";
import { getKpis, type DashboardKpis } from "./kpis.repository.server";
import { getTrends, type DashboardTrends } from "./trends.repository.server";

export interface DashboardData {
  kpis: LoaderState<DashboardKpis>;
  attention: LoaderState<AttentionItem[]>;
  trends: LoaderState<DashboardTrends>;
}

export const loadDashboard = async (): Promise<DashboardData> => {
  const [kpis, attention, trends] = await Promise.allSettled([
    getKpis(),
    getNeedsAttention(),
    getTrends(),
  ]);

  return {
    kpis: settledToLoaderState(kpis),
    attention: settledToLoaderState(attention),
    trends: settledToLoaderState(trends),
  };
};
