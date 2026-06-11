import { Box, Card, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { DataView } from "~/components/feedback/data-view";
import type { VehicleStatsKpisView, VehicleStatsState } from "../types";
import { VehicleCostChart } from "./vehicle-cost-chart";
import { VehicleEfficiencyChart } from "./vehicle-efficiency-chart";
import { VehicleMileageChart } from "./vehicle-mileage-chart";

export function VehicleStats({ state }: { state: VehicleStatsState }) {
  return (
    <DataView state={state} className="h-[200px]" loading={<StatsSkeleton />}>
      {(data) => (
        <Flex direction="column" gap="6">
          <StatsKpis kpis={data.kpis} />
          <VehicleMileageChart points={data.mileage} />
          <VehicleCostChart points={data.costs} />
          <VehicleEfficiencyChart points={data.efficiency} hasData={data.hasEfficiency} />
        </Flex>
      )}
    </DataView>
  );
}

const KPI_ITEMS: { key: keyof VehicleStatsKpisView; label: string }[] = [
  { key: "totalCost", label: "Koszty (12 mies.)" },
  { key: "avgEfficiency", label: "Śr. zużycie" },
  { key: "avgKmPerDay", label: "Śr. dzienny przebieg" },
];

function StatsKpis({ kpis }: { kpis: VehicleStatsKpisView }) {
  return (
    <section aria-label="Wskaźniki pojazdu">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KPI_ITEMS.map((item) => (
          <Card key={item.key} size="2">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="medium">
                {item.label}
              </Text>
              <Heading as="h3" size="5" weight="bold">
                {kpis[item.key]}
              </Heading>
            </Flex>
          </Card>
        ))}
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return (
    <Flex direction="column" gap="6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} size="2">
            <Flex direction="column" gap="2">
              <Skeleton width="60%" height="14px" />
              <Skeleton width="80%" height="28px" />
            </Flex>
          </Card>
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} size="3">
          <Skeleton width="40%" height="20px" />
          <Box mt="4" className="h-[240px]">
            <Skeleton width="100%" height="100%" role="status" aria-label="Wczytuję wykres" />
          </Box>
        </Card>
      ))}
    </Flex>
  );
}
