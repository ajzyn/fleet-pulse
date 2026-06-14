import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { plnFormatter } from "~/lib/number-formatter";
import { getFuelLabel } from "../../shared/utils/fuel-presentation";
import type { VehicleDetailData } from "../server/loader.server";
import type { VehicleHeaderView } from "../types";

export const useVehicleHeader = ({
  vehicle,
  currentDriver,
}: VehicleDetailData): VehicleHeaderView => ({
  title: `${vehicle.make} ${vehicle.model}`,
  vin: vehicle.vin,
  year: vehicle.year,
  fuelLabel: getFuelLabel(vehicle.fuelType),
  mileage: `${vehicle.currentMileageKm.toLocaleString("pl-PL")} km`,
  lastService: vehicle.lastServiceAt
    ? format(vehicle.lastServiceAt, "d MMM yyyy", { locale: pl })
    : "—",
  driver: currentDriver
    ? `${currentDriver.firstName} ${currentDriver.lastName}`
    : "Brak przypisania",
  purchaseDate: format(new Date(vehicle.purchaseDate), "d MMM yyyy", { locale: pl }),
  purchasePrice: plnFormatter.format(Number(vehicle.purchasePrice)),
});
