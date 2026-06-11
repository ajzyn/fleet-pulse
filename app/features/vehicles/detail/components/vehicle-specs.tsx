import type { Vehicle } from "@db/schema";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Button, Card, Code, DataList, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useEffect, useRef } from "react";
import { usePlateEdit } from "../hooks/use-plate-edit";
import type { VehicleHeaderView } from "../types";

interface VehicleSpecsProps {
  view: VehicleHeaderView;
  vehicle: Vehicle;
}

export function VehicleSpecs({ view, vehicle }: VehicleSpecsProps) {
  const plate = usePlateEdit(vehicle);

  return (
    <Card size="3" asChild>
      <section aria-label="Dane pojazdu">
        <Flex justify="between" align="center" mb="4" gap="3">
          <Heading as="h2" size="4">
            Dane pojazdu
          </Heading>
          {!plate.editing && (
            <Button variant="ghost" color="gray" onClick={plate.onEdit}>
              <Pencil1Icon aria-hidden />
              Edytuj
            </Button>
          )}
        </Flex>
        <DataList.Root orientation="horizontal">
          <DataList.Item>
            <DataList.Label>Tablica</DataList.Label>
            <DataList.Value>
              {plate.editing ? (
                <PlateEditField plate={plate} />
              ) : (
                <Text>{plate.optimisticPlate}</Text>
              )}
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>VIN</DataList.Label>
            <DataList.Value>
              <Code variant="ghost">{view.vin}</Code>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Rok</DataList.Label>
            <DataList.Value>{view.year}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Paliwo</DataList.Label>
            <DataList.Value>{view.fuelLabel}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Przebieg</DataList.Label>
            <DataList.Value>{view.mileage}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Kierowca</DataList.Label>
            <DataList.Value>{view.driver}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Ostatni serwis</DataList.Label>
            <DataList.Value>{view.lastService}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Data zakupu</DataList.Label>
            <DataList.Value>{view.purchaseDate}</DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Cena zakupu</DataList.Label>
            <DataList.Value>{view.purchasePrice}</DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </section>
    </Card>
  );
}

function PlateEditField({ plate }: { plate: ReturnType<typeof usePlateEdit> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("plateNumber");
        plate.submit(typeof value === "string" ? value : "");
      }}
    >
      <Flex direction="column" gap="1" align="start">
        <Flex gap="2" align="center" wrap="wrap">
          <TextField.Root
            ref={inputRef}
            name="plateNumber"
            defaultValue={plate.optimisticPlate}
            disabled={plate.isPending}
            aria-label="Tablica rejestracyjna"
            {...(plate.fieldError && { color: "red" as const })}
          />
          <Button type="submit" loading={plate.isPending}>
            Zapisz
          </Button>
          <Button
            type="button"
            variant="soft"
            color="gray"
            disabled={plate.isPending}
            onClick={plate.onCancel}
          >
            Anuluj
          </Button>
        </Flex>
        {plate.fieldError && (
          <Text size="1" color="red">
            {plate.fieldError}
          </Text>
        )}
      </Flex>
    </form>
  );
}
