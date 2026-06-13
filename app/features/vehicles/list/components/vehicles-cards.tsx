import type { Vehicle } from "@db/schema";
import { Card, Flex, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { VehicleStatusCell } from "~/features/vehicles/shared/components/vehicle-status-cell";
import { getFuelLabel } from "~/features/vehicles/shared/utils/fuel-presentation";

export function VehiclesCards({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <Flex direction="column" gap="3" asChild>
      <ul className="list-none p-0 m-0">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id}>
            <VehicleCard
              vehicle={vehicle}
              statusSlot={<VehicleStatusCell vehicle={vehicle} size="1" />}
            />
          </li>
        ))}
      </ul>
    </Flex>
  );
}

export type CardVehicle = Pick<
  Vehicle,
  "id" | "plateNumber" | "make" | "model" | "year" | "currentMileageKm" | "fuelType"
>;

interface VehicleCardProps {
  vehicle: CardVehicle;
  statusSlot: ReactNode;
}

export function VehicleCard({ vehicle, statusSlot }: VehicleCardProps) {
  return (
    <Card size="2" asChild>
      <article aria-label={`${vehicle.make} ${vehicle.model}, ${vehicle.plateNumber}`}>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="start" gap="3">
            <Flex direction="column" gap="1" minWidth="0">
              <Text size="5" weight="bold" className="tracking-wide">
                {vehicle.plateNumber}
              </Text>
              <Text size="2" color="gray">
                {vehicle.make} {vehicle.model} - {vehicle.year}
              </Text>
            </Flex>
            {statusSlot}
          </Flex>
          <Flex gap="6">
            <CardField
              label="Przebieg"
              value={`${vehicle.currentMileageKm.toLocaleString("pl-PL")} km`}
            />
            <CardField label="Paliwo" value={getFuelLabel(vehicle.fuelType)} />
          </Flex>
        </Flex>
      </article>
    </Card>
  );
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray" className="uppercase tracking-wide">
        {label}
      </Text>
      <Text size="2" weight="medium">
        {value}
      </Text>
    </Flex>
  );
}
