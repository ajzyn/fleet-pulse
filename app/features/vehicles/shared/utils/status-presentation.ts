import type { Vehicle } from "@db/schema";
import type { BadgeProps } from "@radix-ui/themes";

export const statusColor: Record<Vehicle["status"], NonNullable<BadgeProps["color"]>> = {
  active: "green",
  in_maintenance: "yellow",
  retired: "red",
};

export const STATUSES = [
  "active",
  "in_maintenance",
  "retired",
] as const satisfies Vehicle["status"][];

const STATUS_LABELS: Record<Vehicle["status"], string> = {
  active: "Active",
  in_maintenance: "In maintenance",
  retired: "Retired",
};

export const getStatusLabel = (status: Vehicle["status"]) => STATUS_LABELS[status];
