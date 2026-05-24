import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, type MaintenanceEvent } from "@db/schema";
import { and, gte, inArray, isNotNull, sum } from "drizzle-orm";
import { getFirstColumnValue } from "~/lib/server/rows.server";
import { startOfMonthSql } from "~/lib/server/sql.server";

export type CostBreakdownCategory = "fuel" | "maintenance_planned" | "maintenance_unplanned";
type MaintenanceType = MaintenanceEvent["type"];

export interface CostBreakdownSlice {
  category: CostBreakdownCategory;
  amount: number;
  percentage: number;
}

const PLANNED_MAINTENANCE_TYPES = [
  "oil_change",
  "tire_rotation",
  "inspection",
] as const satisfies MaintenanceType[];
const UNPLANNED_MAINTENANCE_TYPES = ["repair", "accident"] as const satisfies MaintenanceType[];

export const getCostBreakdownMtd = async (): Promise<CostBreakdownSlice[]> => {
  const currentMonthStartSql = startOfMonthSql();

  const [fuelCostsMtdRows, plannedMaintenanceCostsMtdRows, unplannedMaintenanceCostsMtdRows] =
    await Promise.all([
      db
        .select({
          totalCost: sum(fuelTransactions.cost).mapWith(Number),
        })
        .from(fuelTransactions)
        .where(gte(fuelTransactions.transactionAt, currentMonthStartSql)),
      db
        .select({
          totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        })
        .from(maintenanceEvents)
        .where(
          and(
            gte(maintenanceEvents.eventAt, currentMonthStartSql),
            inArray(maintenanceEvents.type, PLANNED_MAINTENANCE_TYPES),
            isNotNull(maintenanceEvents.cost),
          ),
        ),
      db
        .select({
          totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        })
        .from(maintenanceEvents)
        .where(
          and(
            gte(maintenanceEvents.eventAt, currentMonthStartSql),
            inArray(maintenanceEvents.type, UNPLANNED_MAINTENANCE_TYPES),
            isNotNull(maintenanceEvents.cost),
          ),
        ),
    ]);

  const fuelCosts = getFirstColumnValue(fuelCostsMtdRows, "totalCost");
  const plannedCosts = getFirstColumnValue(plannedMaintenanceCostsMtdRows, "totalCost");
  const unplannedCosts = getFirstColumnValue(unplannedMaintenanceCostsMtdRows, "totalCost");
  const totalCosts = fuelCosts + plannedCosts + unplannedCosts;

  return [
    buildSlice("fuel", fuelCosts, totalCosts),
    buildSlice("maintenance_planned", plannedCosts, totalCosts),
    buildSlice("maintenance_unplanned", unplannedCosts, totalCosts),
  ];
};

const buildSlice = (
  category: CostBreakdownCategory,
  amount: number,
  totalCosts: number,
): CostBreakdownSlice => ({
  amount,
  category,
  percentage: totalCosts > 0 ? Math.round((amount / totalCosts) * 1000) / 10 : 0,
});
