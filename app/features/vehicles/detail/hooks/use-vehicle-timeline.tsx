import type { MaintenanceEvent } from "@db/schema";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useRevalidator } from "react-router";
import { plnFormatter } from "~/lib/number-formatter";
import type { LoaderState } from "~/lib/server/loader";
import type { TimelineEvent, VehicleTimeline } from "../server/timeline.repository.server";
import type { TimelineEventView, VehicleTimelineState } from "../types";

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

export const useVehicleTimeline = (state: LoaderState<VehicleTimeline>): VehicleTimelineState => {
  const { revalidate } = useRevalidator();

  if (state.status === "error") {
    return { status: "error", message: state.message, onRetry: revalidate };
  }

  const { events, total } = state.data;

  if (total === 0) {
    return { status: "empty", reason: "Brak zdarzeń serwisowych i tankowań" };
  }

  const views = events.map(toView);

  return { status: "success", events: views, total, shownCount: views.length };
};
