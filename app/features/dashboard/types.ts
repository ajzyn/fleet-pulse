import type { DeltaBadgeProps } from "./components/delta-badge";

export type KPICardState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => Promise<void> }
  | { status: "empty"; reason: string }
  | {
      status: "success";
      value: string;
      subtitle?: string;
      delta?: DeltaBadgeProps;
      sparkline?: number[];
    };

export interface KpiCardConfig {
  key: string;
  title: string;
  href: string;
  state: KPICardState;
}
