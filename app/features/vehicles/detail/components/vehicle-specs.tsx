import { Card, Code, DataList, Heading } from "@radix-ui/themes";
import type { VehicleHeaderView } from "../types";

export function VehicleSpecs({ view }: { view: VehicleHeaderView }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Dane pojazdu">
        <Heading as="h2" size="4" mb="4">
          Dane pojazdu
        </Heading>
        <DataList.Root orientation={{ initial: "vertical", sm: "horizontal" }}>
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
