import type { Vehicle } from "@db/schema";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Button, Card, Code, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useEffect, useRef } from "react";
import { ResponsiveDataList, type DataPair } from "~/components/responsive-data-list";
import { usePlateEdit } from "../hooks/use-plate-edit";
import type { VehicleHeaderView } from "../types";

interface VehicleSpecsProps {
  view: VehicleHeaderView;
  vehicle: Vehicle;
}

export function VehicleSpecs({ view, vehicle }: VehicleSpecsProps) {
  const plate = usePlateEdit(vehicle);

  const items: DataPair[] = [
    {
      label: "Tablica",
      fullWidth: true,
      value: plate.editing ? (
        <PlateEditField plate={plate} />
      ) : (
        <Text>{plate.optimisticPlate}</Text>
      ),
    },
    { label: "VIN", fullWidth: true, value: <Code variant="ghost">{view.vin}</Code> },
    { label: "Rok", value: view.year },
    { label: "Paliwo", value: view.fuelLabel },
    { label: "Przebieg", value: view.mileage },
    { label: "Kierowca", value: view.driver },
    { label: "Ostatni serwis", value: view.lastService },
    { label: "Data zakupu", value: view.purchaseDate },
    { label: "Cena zakupu", value: view.purchasePrice },
  ];

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
        <ResponsiveDataList items={items} />
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
      <Flex direction="column" gap="2" align="stretch">
        <TextField.Root
          ref={inputRef}
          name="plateNumber"
          defaultValue={plate.optimisticPlate}
          disabled={plate.isPending}
          aria-label="Tablica rejestracyjna"
          className="w-full sm:max-w-[200px]"
          {...(plate.fieldError && { color: "red" as const })}
        />
        <Flex gap="2">
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
