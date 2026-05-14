import { Box, Container, Heading } from "@radix-ui/themes";
import { DataTable } from "~/components/data-table";
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
    <Container size="4" p={{ initial: "0", md: "4" }} pt="4">
      <Box px={{ initial: "4", md: "0" }}>
        <Heading size="6" mb="4">
          Vehicles
        </Heading>

        <VehiclesFilters {...filters} />
      </Box>

      <DataTable.Root table={table}>
        <DataTable.Table>
          <DataTable.Header fixedWidths />
          <DataTable.Body
            isLoading={isLoading}
            skeletonRows={pageSize}
            emptyMessage="No vehicles"
          />
        </DataTable.Table>
        <DataTable.Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setPage}
        />
      </DataTable.Root>
    </Container>
  );
}
