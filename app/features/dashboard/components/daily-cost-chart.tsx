import { Box, Card, Flex, Heading, Skeleton, Text, VisuallyHidden } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
  type TooltipContentProps,
} from "recharts";
import { DataView } from "~/components/feedback/data-view";
import { plnCompactFormatter, plnFormatter } from "~/lib/number-formatter";
import { isTooltipVisible, valueByDataKey } from "~/lib/recharts/tooltip";
import type { DailyCostChartState, DailyCostPointView } from "../types";

const CHART_HEIGHT = 280;
const CHART_HEIGHT_CLASS = "h-[280px]";
const FUEL_COLOR = "var(--orange-9)";
const MAINTENANCE_COLOR = "var(--blue-9)";

const SERIES_LABEL: Record<string, string> = {
  fuel: "Paliwo",
  maintenance: "Serwis",
};

export function DailyCostChart({ state }: { state: DailyCostChartState }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Dzienne koszty w ostatnich 30 dniach">
        <Heading as="h2" size="4" mb="4">
          Dzienne koszty (30 dni)
        </Heading>
        <DataView
          state={state}
          className={CHART_HEIGHT_CLASS}
          loading={
            <Box className={CHART_HEIGHT_CLASS}>
              <Skeleton width="100%" height="100%" role="status" aria-label="Wczytuję wykres" />
            </Box>
          }
        >
          {(data) => <DailyCostBars points={data.points} />}
        </DataView>
      </section>
    </Card>
  );
}

function DailyCostBars({ points }: { points: DailyCostPointView[] }) {
  const navigate = useNavigate();

  const handleClick = (data: MouseHandlerDataParam) => {
    const idx = data.activeTooltipIndex;
    if (typeof idx !== "number") return;
    const point = points[idx];
    if (!point) return;
    void navigate(`/costs?date=${point.date}`);
  };

  return (
    <>
      <Box height={`${CHART_HEIGHT.toString()}px`}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 0, height: CHART_HEIGHT }}
        >
          <BarChart
            data={points}
            onClick={handleClick}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
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
              tickFormatter={(v: number) => plnCompactFormatter.format(v)}
              tick={{ fill: "var(--gray-11)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--gray-a5)" }}
              width={56}
            />
            <Tooltip content={DailyCostTooltip} cursor={{ fill: "var(--gray-a3)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => SERIES_LABEL[value] ?? value}
            />
            <Bar dataKey="fuel" stackId="cost" fill={FUEL_COLOR} cursor="pointer" />
            <Bar
              dataKey="maintenance"
              stackId="cost"
              fill={MAINTENANCE_COLOR}
              cursor="pointer"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <VisuallyHidden>
        <table>
          <caption>Dzienne koszty floty (paliwo, serwis) w ostatnich 30 dniach, w PLN</caption>
          <thead>
            <tr>
              <th scope="col">Dzień</th>
              <th scope="col">Paliwo</th>
              <th scope="col">Serwis</th>
              <th scope="col">Razem</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <th scope="row">{p.label}</th>
                <td>{plnFormatter.format(p.fuel)}</td>
                <td>{plnFormatter.format(p.maintenance)}</td>
                <td>{plnFormatter.format(p.fuel + p.maintenance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </>
  );
}

function DailyCostTooltip(props: TooltipContentProps) {
  if (!isTooltipVisible(props)) return null;

  const fuel = valueByDataKey(props.payload, "fuel");
  const maintenance = valueByDataKey(props.payload, "maintenance");
  const total = fuel + maintenance;
  const { label } = props;

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="160px">
        <Text size="2" weight="bold">
          {label}
        </Text>
        <TooltipRow color={FUEL_COLOR} label="Paliwo" value={fuel} />
        <TooltipRow color={MAINTENANCE_COLOR} label="Serwis" value={maintenance} />
        <Text size="1" color="gray" mt="1">
          Razem: <Text weight="bold">{plnFormatter.format(total)}</Text>
        </Text>
      </Flex>
    </Card>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: number }) {
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
