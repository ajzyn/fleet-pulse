import { ExclamationTriangleIcon, InfoCircledIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, IconButton, Skeleton, Text } from "@radix-ui/themes";
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
import type { DailyCostChartState, DailyCostPointView } from "../types";

const CHART_HEIGHT = 280;
const FUEL_COLOR = "var(--orange-9)";
const MAINTENANCE_COLOR = "var(--blue-9)";

const compactPlnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  notation: "compact",
  maximumFractionDigits: 0,
});

const fullPlnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const SERIES_LABEL: Record<string, string> = {
  fuel: "Paliwo",
  maintenance: "Serwis",
};

export function DailyCostChart({ state }: { state: DailyCostChartState }) {
  const refreshHandler =
    state.status === "success" || state.status === "empty" ? state.onRefresh : null;

  return (
    <Card size="3" asChild>
      <section aria-label="Dzienne koszty w ostatnich 30 dniach">
        <Flex justify="between" align="center" mb="4" gap="3">
          <Heading as="h2" size="4">
            Dzienne koszty (30 dni)
          </Heading>
          {refreshHandler ? (
            <IconButton
              variant="ghost"
              color="gray"
              onClick={() => void refreshHandler()}
              aria-label="Odśwież wykres"
            >
              <ReloadIcon />
            </IconButton>
          ) : null}
        </Flex>
        <DailyCostChartContent state={state} />
      </section>
    </Card>
  );
}

function DailyCostChartContent({ state }: { state: DailyCostChartState }) {
  if (state.status === "loading") {
    return (
      <Skeleton
        width="100%"
        height={`${CHART_HEIGHT.toString()}px`}
        role="status"
        aria-label="Wczytuję wykres"
      />
    );
  }

  if (state.status === "error") {
    return (
      <Flex
        direction="column"
        gap="3"
        align="start"
        minHeight={`${CHART_HEIGHT.toString()}px`}
        justify="center"
      >
        <Flex gap="2" align="center">
          <ExclamationTriangleIcon color="red" />
          <Text size="2" color="red">
            {state.message}
          </Text>
        </Flex>
        <Button size="2" variant="soft" onClick={() => void state.onRetry()}>
          Spróbuj ponownie
        </Button>
      </Flex>
    );
  }

  if (state.status === "empty") {
    return (
      <Flex
        direction="column"
        gap="2"
        align="start"
        minHeight={`${CHART_HEIGHT.toString()}px`}
        justify="center"
      >
        <Flex gap="2" align="center">
          <InfoCircledIcon color="gray" />
          <Text size="2" color="gray">
            {state.reason}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return <DailyCostBars points={state.points} />;
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
            tickFormatter={(v: number) => compactPlnFormatter.format(v)}
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
  );
}

function DailyCostTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || payload.length === 0) return null;

  const fuelEntry = payload.find((p) => p.dataKey === "fuel");
  const maintenanceEntry = payload.find((p) => p.dataKey === "maintenance");
  const fuel = typeof fuelEntry?.value === "number" ? fuelEntry.value : 0;
  const maintenance = typeof maintenanceEntry?.value === "number" ? maintenanceEntry.value : 0;
  const total = fuel + maintenance;

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="160px">
        <Text size="2" weight="bold">
          {label}
        </Text>
        <TooltipRow color={FUEL_COLOR} label="Paliwo" value={fuel} />
        <TooltipRow color={MAINTENANCE_COLOR} label="Serwis" value={maintenance} />
        <Text size="1" color="gray" mt="1">
          Razem: <Text weight="bold">{fullPlnFormatter.format(total)}</Text>
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
        {fullPlnFormatter.format(value)}
      </Text>
    </Flex>
  );
}
