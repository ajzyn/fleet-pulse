import type { Vehicle } from "@db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { VehicleStatusCell } from "~/features/vehicles/shared/components/vehicle-status-cell";
import { getFuelLabel } from "~/features/vehicles/shared/utils/fuel-presentation";

export const vehiclesTableColumns: ColumnDef<Vehicle>[] = [
  { accessorKey: "plateNumber", header: "Rejestracja", size: 120 },
  { accessorKey: "vin", header: "VIN", size: 180 },
  {
    id: "make",
    header: "Marka / Model",
    accessorFn: (row) => `${row.make} ${row.model}`,
    enableSorting: true,
    size: 150,
  },
  { accessorKey: "year", header: "Rok", enableSorting: true, size: 80 },
  {
    accessorKey: "fuelType",
    header: "Paliwo",
    size: 100,
    cell: ({ row }) => getFuelLabel(row.original.fuelType),
  },
  {
    id: "mileage",
    accessorKey: "currentMileageKm",
    header: "Przebieg (km)",
    enableSorting: true,
    size: 130,
    cell: ({ getValue }) => getValue<number>().toLocaleString("pl-PL"),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 160,
    cell: ({ row }) => <VehicleStatusCell vehicle={row.original} />,
  },
];
