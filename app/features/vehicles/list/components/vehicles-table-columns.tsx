import type { Vehicle } from "@db/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { VehicleStatusCell } from "~/features/vehicles/shared/components/vehicle-status-cell";

export const vehiclesTableColumns: ColumnDef<Vehicle>[] = [
  { accessorKey: "plateNumber", header: "Plate", size: 120 },
  { accessorKey: "vin", header: "VIN", size: 180 },
  {
    id: "make",
    header: "Make / Model",
    accessorFn: (row) => `${row.make} ${row.model}`,
    enableSorting: true,
    size: 150,
  },
  { accessorKey: "year", header: "Year", enableSorting: true, size: 80 },
  { accessorKey: "fuelType", header: "Fuel", size: 100 },
  {
    id: "mileage",
    accessorKey: "currentMileageKm",
    header: "Mileage (km)",
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
