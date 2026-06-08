import type { TooltipContentProps } from "recharts";

type TooltipEntry = TooltipContentProps["payload"][number];

export function isTooltipVisible(props: TooltipContentProps): boolean {
  return props.active && props.payload.length > 0;
}

export function toNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

export function valueByDataKey(payload: readonly TooltipEntry[], dataKey: string): number {
  return toNumber(payload.find((entry) => entry.dataKey === dataKey)?.value);
}
