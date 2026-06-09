import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Flex, Link } from "@radix-ui/themes";
import { Link as RouterLink } from "react-router";
import { Page } from "~/components/page";
import { VehicleStatusCell } from "~/features/vehicles/shared/components/vehicle-status-cell";
import type { Route } from "../../../routes/vehicles/+types/details";
import { VehicleSpecs } from "./components/vehicle-specs";
import { useVehicleHeader } from "./hooks/use-vehicle-header";

interface VehicleDetailProps {
  loaderData: Route.ComponentProps["loaderData"];
}

export default function VehicleDetail({ loaderData }: VehicleDetailProps) {
  const view = useVehicleHeader(loaderData);

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
        subtitle={view.plateNumber}
        actions={<VehicleStatusCell vehicle={loaderData.vehicle} size="3" />}
      />
      <Page.Body>
        <VehicleSpecs view={view} />
      </Page.Body>
    </Page.Root>
  );
}
