import { getCoreRowModel, useReactTable, type SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import { useNavigation } from "react-router";
import { useTableUrlParams } from "~/hooks/use-table-url-params";
import type { Route } from "../../../../routes/vehicles/+types/list";
import { vehiclesTableColumns } from "../components/vehicles-table-columns";
import type { FilterKey } from "../types";

export const useVehiclesTable = (loaderData: Route.ComponentProps["loaderData"]) => {
  const { query, rows, total } = loaderData;
  const navigation = useNavigation();
  const { setSort } = useTableUrlParams<FilterKey>();

  const sorting: SortingState = useMemo(
    () => (query.sort ? [{ id: query.sort.field, desc: query.sort.dir === "desc" }] : []),
    [query.sort],
  );

  const table = useReactTable({
    data: rows,
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
    totalPages: Math.ceil(total / query.pageSize),
    pageSize: query.pageSize,
    currentPage: query.page,
  };
};
