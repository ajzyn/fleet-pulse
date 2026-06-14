import type { MaintenanceEvent } from "@db/schema";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useRevalidator } from "react-router";
import { useLoadMoreList } from "~/hooks/use-load-more-list";
import { plnFormatter } from "~/lib/number-formatter";
import type { LoaderState } from "~/lib/server/loader";
import type { Page } from "~/lib/server/pagination";
import type { TimelineEvent } from "../server/timeline.repository.server";
import type { TimelineEventView, VehicleTimelineState } from "../types";

const EMPTY_PAGE: Page<TimelineEvent> = { items: [], nextCursor: null, total: 0 };

const MAINTENANCE_LABELS: Record<MaintenanceEvent["type"], string> = {
  oil_change: "Wymiana oleju",
  tire_rotation: "Rotacja opon",
  inspection: "Przegląd",
  repair: "Naprawa",
  accident: "Wypadek",
};

const STATUS_BADGE: Record<
  MaintenanceEvent["status"],
  NonNullable<TimelineEventView["statusBadge"]>
> = {
  scheduled: { label: "Zaplanowany", color: "blue" },
  completed: { label: "Zakończony", color: "gray" },
  overdue: { label: "Przeterminowany", color: "red" },
};

const STATUS_DOT: Record<MaintenanceEvent["status"], string> = {
  scheduled: "var(--blue-9)",
  completed: "var(--gray-8)",
  overdue: "var(--red-9)",
};

const litersFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

const toView = (event: TimelineEvent): TimelineEventView => {
  const base = {
    id: event.id,
    dateLabel: format(event.at, "d MMM yyyy", { locale: pl }),
    mileageLabel: `${event.mileageKm.toLocaleString("pl-PL")} km`,
    costLabel: event.cost === null ? null : plnFormatter.format(event.cost),
  };

  if (event.kind === "fuel") {
    return {
      ...base,
      title: "Tankowanie",
      detail: `${litersFormatter.format(event.liters)} l · ${event.stationName}`,
      dotColor: "var(--orange-9)",
      statusBadge: null,
    };
  }

  return {
    ...base,
    title: MAINTENANCE_LABELS[event.type],
    detail: event.workshopName ?? "Brak warsztatu",
    dotColor: STATUS_DOT[event.status],
    statusBadge: STATUS_BADGE[event.status],
  };
};

export const useVehicleTimeline = (
  state: LoaderState<Page<TimelineEvent>>,
  vehicleId: string,
): VehicleTimelineState => {
  const { revalidate } = useRevalidator();
  const list = useLoadMoreList<TimelineEvent>({
    endpoint: `/vehicles/${vehicleId}/timeline`,
    initial: state.status === "ok" ? state.data : EMPTY_PAGE,
  });

  if (state.status === "error") {
    return { status: "error", message: state.message, onRetry: revalidate };
  }

  if ((list.total ?? 0) === 0) {
    return { status: "empty", reason: "Brak zdarzeń serwisowych i tankowań" };
  }

  return {
    status: "success",
    events: list.items.map(toView),
    total: list.total ?? 0,
    shownCount: list.items.length,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMoreError: list.error,
    onLoadMore: list.loadMore,
    onRetryLoadMore: list.retry,
  };
};
