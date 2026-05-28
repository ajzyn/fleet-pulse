export type ChipKind =
  | "overdue_maintenance"
  | "maintenance_due_soon"
  | "fuel_anomaly"
  | "cost_anomaly"
  | "idle_too_long";

export type AttentionStatus = "active" | "in_maintenance" | "retired";

export interface AttentionData {
  items: AttentionItem[];
  totalCount: number;
}

export interface AttentionItem {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  status: Exclude<AttentionStatus, "retired">;
  chips: ChipKind[];
  severityScore: number;
}

export interface AttentionRow {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  status: AttentionStatus;
  isServiceOverdue: boolean;
  isServiceDueSoon: boolean;
  lastStartedAt: Date | null;
  recentFuelLiters: number;
  recentDistanceKm: number;
  recentFuelCost: number;
  recentMaintenanceCost: number;
  baselineFuelAvg: number | null;
  baselineFuelStddev: number | null;
  baselineFuelSamples: number | null;
  baselineFuelCostAvg: number | null;
  baselineFuelCostStddev: number | null;
  baselineFuelCostSamples: number | null;
  baselineMaintenanceCostAvg: number | null;
  baselineMaintenanceCostStddev: number | null;
  baselineMaintenanceCostSamples: number | null;
}
