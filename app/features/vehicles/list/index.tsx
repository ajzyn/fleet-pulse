import type { Vehicle } from "@db/schema";
import { Box, Button, Flex, Skeleton, Spinner, Text } from "@radix-ui/themes";
import type { Table } from "@tanstack/react-table";
import { useLocation } from "react-router";
import { DataTable } from "~/components/data-table";
import { DataView, type DataViewState } from "~/components/feedback/data-view";
import { Page } from "~/components/page";
import { useLoadMoreList, type UseLoadMoreListResult } from "~/hooks/use-load-more-list";
import { useMediaQuery } from "~/hooks/use-media-query";
import type { Route } from "../../../routes/vehicles/+types/list";
import { VehiclesCards } from "./components/vehicles-cards";
import { VehiclesFilters } from "./components/vehicles-filters";
import { useVehiclesFilters } from "./hooks/use-vehicles-filters";
import { useVehiclesTable } from "./hooks/use-vehicles-table";

const SKELETON_CARDS = 5;
const SKELETON_ROWS = 8;

interface VehiclesListProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export default function VehiclesList({ loaderData }: VehiclesListProps) {
  const { query, page } = loaderData;
  const { search } = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const list = useLoadMoreList<Vehicle>({
    endpoint: `/vehicles/data${search}`,
    initial: page,
    resetKey: search,
  });
  const filters = useVehiclesFilters(query.q ?? "");
  const { table, isLoading } = useVehiclesTable(list.items, query);

  const state: DataViewState<{ vehicles: Vehicle[] }> =
    list.items.length > 0
      ? { status: "success", vehicles: list.items }
      : isLoading
        ? { status: "loading" }
        : { status: "empty", reason: "Brak pojazdów" };

  return (
    <Page.Root>
      <Page.Header title="Pojazdy" actions={<VehiclesFilters {...filters} />} />
      <Page.Body>
        <DataView
          state={state}
          loading={isDesktop ? <VehiclesTable table={table} isLoading /> : <CardsSkeleton />}
        >
          {({ vehicles }) => (
            <>
              <Box aria-busy={isLoading} style={isLoading ? { opacity: 0.5 } : undefined}>
                {isDesktop ? (
                  <VehiclesTable table={table} />
                ) : (
                  <VehiclesCards vehicles={vehicles} />
                )}
              </Box>
              <LoadMore list={list} />
            </>
          )}
        </DataView>
      </Page.Body>
    </Page.Root>
  );
}

function VehiclesTable({
  table,
  isLoading = false,
}: {
  table: Table<Vehicle>;
  isLoading?: boolean;
}) {
  return (
    <DataTable.Root table={table}>
      <div className="-mx-4 md:mx-0 overflow-x-auto">
        <div className="px-4 md:px-0 w-fit min-w-full">
          <DataTable.Table>
            <DataTable.Header fixedWidths />
            <DataTable.Body
              isLoading={isLoading}
              skeletonRows={SKELETON_ROWS}
              emptyMessage="Brak pojazdów"
            />
          </DataTable.Table>
        </div>
      </div>
    </DataTable.Root>
  );
}

function LoadMore({ list }: { list: UseLoadMoreListResult<Vehicle> }) {
  return (
    <Flex
      direction="column"
      align="center"
      gap="2"
      py="4"
      aria-live="polite"
      aria-busy={list.isLoadingMore}
    >
      {list.hasMore && !list.error && (
        <>
          <DataTable.LoadMoreTrigger onLoadMore={list.loadMore} disabled={list.isLoadingMore} />
          {list.isLoadingMore && (
            <Flex gap="2" align="center">
              <Spinner />
              <Text size="2" color="gray">
                Wczytywanie kolejnych pojazdów…
              </Text>
            </Flex>
          )}
        </>
      )}
      {list.error && (
        <Flex gap="2" align="center">
          <Text size="2" color="red">
            Nie udało się wczytać kolejnych pojazdów
          </Text>
          <Button size="1" variant="ghost" onClick={list.retry}>
            Spróbuj ponownie
          </Button>
        </Flex>
      )}
    </Flex>
  );
}

function CardsSkeleton() {
  return (
    <Flex direction="column" gap="3">
      {Array.from({ length: SKELETON_CARDS }, (_, i) => (
        <Skeleton key={i} height="120px" style={{ borderRadius: "var(--radius-4)" }} />
      ))}
    </Flex>
  );
}
