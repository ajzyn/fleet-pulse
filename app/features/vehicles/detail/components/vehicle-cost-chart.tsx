import { Box, Card, Flex, Heading, Text, VisuallyHidden } from "@radix-ui/themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { plnFormatter } from "~/lib/number-formatter";
import { isTooltipVisible, valueByDataKey } from "~/lib/recharts/tooltip";
import type { CostPointView } from "../types";

const CHART_HEIGHT = 240;
const CHART_HEIGHT_CLASS = "h-[240px]";
const FUEL_COLOR = "var(--orange-9)";
const MAINTENANCE_COLOR = "var(--blue-9)";

const costCompactFormatter = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 0,
});

const SERIES_LABEL: Record<string, string> = {
  fuel: "Paliwo",
  maintenance: "Serwis",
};

export function VehicleCostChart({ points }: { points: CostPointView[] }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Miesięczne koszty paliwa i serwisu">
        <Heading as="h2" size="4" mb="4">
          Koszty miesięczne (zł)
        </Heading>
        <Box className={`${CHART_HEIGHT_CLASS} -mx-3 sm:mx-0`}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 0, height: CHART_HEIGHT }}
          >
            <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--gray-a5)" }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tickFormatter={(v: number) => costCompactFormatter.format(v)}
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--gray-a5)" }}
                width={40}
              />
              <Tooltip content={CostTooltip} cursor={{ fill: "var(--gray-a3)" }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value: string) => SERIES_LABEL[value] ?? value}
              />
              <Bar dataKey="fuel" stackId="cost" fill={FUEL_COLOR} />
              <Bar
                dataKey="maintenance"
                stackId="cost"
                fill={MAINTENANCE_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <VisuallyHidden>
          <table>
            <caption>
              Miesięczne koszty pojazdu (paliwo, serwis) za ostatnie 12 miesięcy, w PLN
            </caption>
            <thead>
              <tr>
                <th scope="col">Miesiąc</th>
                <th scope="col">Paliwo</th>
                <th scope="col">Serwis</th>
                <th scope="col">Razem</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{p.label}</th>
                  <td>{plnFormatter.format(p.fuel)}</td>
                  <td>{plnFormatter.format(p.maintenance)}</td>
                  <td>{plnFormatter.format(p.fuel + p.maintenance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VisuallyHidden>
      </section>
    </Card>
  );
}

function CostTooltip(props: TooltipContentProps) {
  if (!isTooltipVisible(props)) return null;

  const fuel = valueByDataKey(props.payload, "fuel");
  const maintenance = valueByDataKey(props.payload, "maintenance");
  const total = fuel + maintenance;

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="160px">
        <Text size="2" weight="bold">
          {props.label}
        </Text>
        <CostRow color={FUEL_COLOR} label="Paliwo" value={fuel} />
        <CostRow color={MAINTENANCE_COLOR} label="Serwis" value={maintenance} />
        <Text size="1" color="gray" mt="1">
          Razem: <Text weight="bold">{plnFormatter.format(total)}</Text>
        </Text>
      </Flex>
    </Card>
  );
}

function CostRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Flex gap="2" align="center" justify="between">
      <Flex gap="2" align="center">
        <Box width="8px" height="8px" style={{ background: color, borderRadius: "2px" }} />
        <Text size="1" color="gray">
          {label}
        </Text>
      </Flex>
      <Text size="1" weight="medium">
        {plnFormatter.format(value)}
      </Text>
    </Flex>
  );
}
