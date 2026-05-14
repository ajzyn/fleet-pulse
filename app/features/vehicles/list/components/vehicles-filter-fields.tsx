import { fuelType, vehicleStatus } from "@db/schema";
import { EnumFilterSelect } from "~/components/filters/enum-filter-select";
import type { FilterKey, FuelType, VehicleStatus } from "../types";
import { getFuelLabel } from "../utils/fuel-presentation";
import { getStatusLabel } from "../utils/status-presentation";

interface VehicleFilterFieldsProps {
  onChange: (key: FilterKey, value: string | undefined) => void;
  status: VehicleStatus | undefined;
  fuel: FuelType | undefined;
}

export function VehicleFilterFields({ onChange, status, fuel }: VehicleFilterFieldsProps) {
  return (
    <>
      <EnumFilterSelect
        id="filter-status"
        label="Status"
        allLabel="All statuses"
        options={vehicleStatus.enumValues}
        getOptionLabel={getStatusLabel}
        value={status}
        onChange={(v) => {
          onChange("status", v);
        }}
      />
      <EnumFilterSelect
        id="filter-fuel"
        label="Fuel type"
        allLabel="All fuel types"
        options={fuelType.enumValues}
        getOptionLabel={getFuelLabel}
        value={fuel}
        onChange={(v) => {
          onChange("fuelType", v);
        }}
      />
    </>
  );
}
