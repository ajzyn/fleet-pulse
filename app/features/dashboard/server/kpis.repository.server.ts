import { getCostPerKm, type CostPerKm } from "./kpis/cost-per-km.repository.server";
import {
  getFleetAvailability,
  type FleetAvailability,
} from "./kpis/fleet-availability.repository.server";
import { getMonthlySpend, type MonthlySpend } from "./kpis/monthly-spend.repository.server";
import { getUtilization, type Utilization } from "./kpis/utilization.repository.server";

export interface DashboardKpis {
  fleetAvailability: FleetAvailability;
  utilization: Utilization;
  costPerKm: CostPerKm;
  monthlySpend: MonthlySpend;
}

export const getKpis = async (): Promise<DashboardKpis> => {
  const [fleetAvailability, utilization, costPerKm, monthlySpend] = await Promise.all([
    getFleetAvailability(),
    getUtilization(),
    getCostPerKm(),
    getMonthlySpend(),
  ]);

  return { fleetAvailability, utilization, costPerKm, monthlySpend };
};
