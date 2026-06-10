import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Flex, Link, Text } from "@radix-ui/themes";
import { Link as RouterLink } from "react-router";
import { Page } from "~/components/page";
import { VehicleStatusCell } from "~/features/vehicles/shared/components/vehicle-status-cell";
import type { Route } from "../../../routes/vehicles/+types/details";
import { VehicleSpecs } from "./components/vehicle-specs";
import { VehicleStats } from "./components/vehicle-stats";
import { VehicleTimeline } from "./components/vehicle-timeline";
import { useVehicleHeader } from "./hooks/use-vehicle-header";
import { useVehicleStats } from "./hooks/use-vehicle-stats";
import { useVehicleTimeline } from "./hooks/use-vehicle-timeline";

interface VehicleDetailProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export default function VehicleDetail({ loaderData }: VehicleDetailProps) {
  const view = useVehicleHeader(loaderData);
  const stats = useVehicleStats(loaderData.stats, loaderData.vehicle.purchaseDate);
  const timeline = useVehicleTimeline(loaderData.timeline);

  return (
    <Page.Root>
      <Flex mb="4">
        <Link asChild size="2" color="gray">
          <RouterLink to="/vehicles">
            <Flex align="center" gap="1">
              <ArrowLeftIcon />
              Pojazdy
            </Flex>
          </RouterLink>
        </Link>
      </Flex>
      <Page.Header
        title={view.title}
        actions={
          <Flex align="center" gap="2">
            <Text size="2" color="gray">
              Vehicle status
            </Text>
            <VehicleStatusCell vehicle={loaderData.vehicle} size="3" />
          </Flex>
        }
      />
      <Page.Body>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
          <div className="lg:sticky lg:top-4">
            <VehicleSpecs view={view} vehicle={loaderData.vehicle} />
          </div>
          <div className="space-y-6">
            <VehicleStats state={stats} />
            <VehicleTimeline state={timeline} />
          </div>
        </div>
      </Page.Body>
    </Page.Root>
  );
}
