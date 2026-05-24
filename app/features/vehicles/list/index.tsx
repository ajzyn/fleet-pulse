import { DataTable } from "~/components/data-table";
import { Page } from "~/components/page";
import { useTableUrlParams } from "~/hooks/use-table-url-params";
import type { Route } from "../../../routes/vehicles/+types/list";
import { VehiclesFilters } from "./components/vehicles-filters";
import { useVehiclesFilters } from "./hooks/use-vehicles-filters";
import { useVehiclesTable } from "./hooks/use-vehicles-table";
import type { FilterKey } from "./types";

interface VehiclesListProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export default function VehiclesList({ loaderData }: VehiclesListProps) {
  const { table, isLoading, totalPages, pageSize, currentPage } = useVehiclesTable(loaderData);
  const filters = useVehiclesFilters(loaderData.query.q ?? "");
  const { setPage } = useTableUrlParams<FilterKey>();

  return (
    <Page.Root>
      <Page.Header title="Vehicles" actions={<VehiclesFilters {...filters} />} />
      <Page.Body>
        <DataTable.Root table={table}>
          <div className="-mx-4 md:mx-0 overflow-x-auto">
            <div className="px-4 md:px-0 w-fit min-w-full">
              <DataTable.Table>
                <DataTable.Header fixedWidths />
                <DataTable.Body
                  isLoading={isLoading}
                  skeletonRows={pageSize}
                  emptyMessage="No vehicles"
                />
              </DataTable.Table>
            </div>
          </div>
          <DataTable.Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setPage}
          />
        </DataTable.Root>
      </Page.Body>
    </Page.Root>
  );
}
