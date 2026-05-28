import { useRevalidator } from "react-router";
import type { Route } from "../../../routes/dashboard/+types/route";
import type { ChipKind } from "../server/attention/types";
import type { AttentionItemView, AttentionListState, ChipTone } from "../types";

const CHIP_LABELS: Record<ChipKind, { label: string; tone: ChipTone }> = {
  overdue_maintenance: { label: "Przegląd przeterminowany", tone: "critical" },
  cost_anomaly: { label: "Anomalia kosztów", tone: "warning" },
  fuel_anomaly: { label: "Anomalia paliwowa", tone: "warning" },
  maintenance_due_soon: { label: "Przegląd zbliża się", tone: "caution" },
  idle_too_long: { label: "Nie jeździ", tone: "info" },
};

const TONE_RANK: Record<ChipTone, number> = {
  critical: 4,
  warning: 3,
  caution: 2,
  info: 1,
};

type AttentionState = Route.ComponentProps["loaderData"]["attention"];

export const useNeedsAttention = (attentionState: AttentionState): AttentionListState => {
  const { revalidate } = useRevalidator();

  if (attentionState.status === "error") {
    return { status: "error", message: attentionState.message, onRetry: revalidate };
  }

  const { items, totalCount } = attentionState.data;

  if (totalCount === 0) {
    return {
      status: "empty",
      reason: "Flota stabilna — brak alertów",
      onRefresh: revalidate,
    };
  }

  const itemViews: AttentionItemView[] = items.map((item) => {
    const chips = item.chips
      .map((kind) => ({
        kind,
        label: CHIP_LABELS[kind].label,
        tone: CHIP_LABELS[kind].tone,
      }))
      .sort((a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone]);

    return {
      vehicleId: item.vehicleId,
      plateNumber: item.plateNumber,
      make: item.make,
      model: item.model,
      status: item.status,
      chips,
      topTone: chips[0]?.tone ?? "info",
      href: `/vehicles/${item.vehicleId}`,
    };
  });

  return {
    status: "success",
    items: itemViews,
    totalCount,
    hasOverflow: totalCount > itemViews.length,
    onRefresh: revalidate,
  };
};
