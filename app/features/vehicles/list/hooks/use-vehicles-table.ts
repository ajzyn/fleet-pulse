import type { Vehicle } from "@db/schema";
import { getCoreRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import { useNavigation } from "react-router";
import { useTableUrlParams } from "~/hooks/use-table-url-params";
import { vehiclesTableColumns } from "../components/vehicles-table-columns";
import type { VehiclesQuery } from "../server/list.params.server";
import type { FilterKey } from "../types";

export const useVehiclesTable = (items: Vehicle[], query: VehiclesQuery) => {
  const navigation = useNavigation();
  const { setSort } = useTableUrlParams<FilterKey>();

  const sorting: SortingState = useMemo(
    () => (query.sort ? [{ id: query.sort.field, desc: query.sort.dir === "desc" }] : []),
    [query.sort],
  );

  const table = useReactTable({
    data: items,
    columns: vehiclesTableColumns,
    state: { sorting },
    onSortingChange: setSort,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualFiltering: true,
    defaultColumn: { enableSorting: false },
    getRowId: (row) => row.id,
  });

  return {
    table,
    isLoading: navigation.state === "loading",
  };
};
