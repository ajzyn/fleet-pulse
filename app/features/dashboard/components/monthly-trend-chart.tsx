import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, Skeleton, Text, VisuallyHidden } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
  type TooltipContentProps,
} from "recharts";
import type { MonthlyTrendChartState, MonthlyTrendPointView } from "../types";

const CHART_HEIGHT_CLASS = "h-[260px] sm:h-[320px]";
const FUEL_COLOR = "var(--orange-9)";
const MAINTENANCE_COLOR = "var(--blue-9)";
const UTILIZATION_COLOR = "var(--grass-9)";
const UTILIZATION_TEXT_COLOR = "var(--grass-11)";

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullPlnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
});

const kmPerDayFormatter = new Intl.NumberFormat("pl-PL", {
  maximumFractionDigits: 1,
});

const SERIES_LABEL: Record<string, string> = {
  fuel: "Paliwo",
  maintenance: "Serwis",
  utilization: "Śr. przebieg (km/dzień)",
};

export function MonthlyTrendChart({ state }: { state: MonthlyTrendChartState }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Trend kosztów i wykorzystania w ostatnich 12 miesiącach">
        <Heading as="h2" size="4" mb="4">
          Trend miesięczny (12 miesięcy)
        </Heading>
        <MonthlyTrendContent state={state} />
      </section>
    </Card>
  );
}

function MonthlyTrendContent({ state }: { state: MonthlyTrendChartState }) {
  if (state.status === "loading") {
    return (
      <Box className={CHART_HEIGHT_CLASS}>
        <Skeleton width="100%" height="100%" role="status" aria-label="Wczytuję wykres" />
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box className={CHART_HEIGHT_CLASS}>
        <Flex direction="column" gap="3" align="start" justify="center" height="100%">
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
      </Box>
    );
  }

  if (state.status === "empty") {
    return (
      <Box className={CHART_HEIGHT_CLASS}>
        <Flex direction="column" gap="2" align="start" justify="center" height="100%">
          <Flex gap="2" align="center">
            <InfoCircledIcon color="gray" />
            <Text size="2" color="gray">
              {state.reason}
            </Text>
          </Flex>
        </Flex>
      </Box>
    );
  }

  return <MonthlyTrendBody points={state.points} />;
}

function MonthlyTrendBody({ points }: { points: MonthlyTrendPointView[] }) {
  const navigate = useNavigate();

  const handleClick = (data: MouseHandlerDataParam) => {
    const idx = data.activeTooltipIndex;
    if (typeof idx !== "number") return;
    const point = points[idx];
    if (!point) return;
    void navigate(`/costs?month=${point.month}`);
  };

  return (
    <>
      <Box className={`${CHART_HEIGHT_CLASS} -mx-3 sm:mx-0`}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 0, height: 260 }}
        >
          <ComposedChart
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
              minTickGap={40}
            />
            <YAxis
              yAxisId="cost"
              tickFormatter={(v: number) => compactNumberFormatter.format(v)}
              tick={{ fill: "var(--gray-11)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--gray-a5)" }}
              width={34}
            />
            <YAxis
              yAxisId="utilization"
              orientation="right"
              tickFormatter={(v: number) => kmPerDayFormatter.format(v)}
              tick={{ fill: UTILIZATION_TEXT_COLOR, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--gray-a5)" }}
              width={30}
            />
            <Tooltip content={MonthlyTrendTooltip} cursor={{ fill: "var(--gray-a3)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => SERIES_LABEL[value] ?? value}
            />
            <Area
              yAxisId="cost"
              dataKey="fuel"
              stackId="cost"
              type="monotone"
              stroke={FUEL_COLOR}
              fill={FUEL_COLOR}
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Area
              yAxisId="cost"
              dataKey="maintenance"
              stackId="cost"
              type="monotone"
              stroke={MAINTENANCE_COLOR}
              fill={MAINTENANCE_COLOR}
              fillOpacity={0.35}
              isAnimationActive={false}
            />
            <Line
              yAxisId="utilization"
              dataKey="utilization"
              type="monotone"
              stroke={UTILIZATION_COLOR}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
      <Flex wrap="wrap" gapX="2" gapY="1" mt="2" align="center">
        <Text size="1" color="gray">
          Lewa oś: koszty (zł)
        </Text>
        <Text size="1" color="gray" aria-hidden>
          ·
        </Text>
        <Text size="1" style={{ color: UTILIZATION_TEXT_COLOR }}>
          Prawa oś: średni przebieg (km/dzień)
        </Text>
      </Flex>
      <VisuallyHidden>
        <table>
          <caption>
            Miesięczny trend kosztów floty (paliwo, serwis) oraz wykorzystania w km na dzień, za
            ostatnie 12 miesięcy
          </caption>
          <thead>
            <tr>
              <th scope="col">Miesiąc</th>
              <th scope="col">Paliwo</th>
              <th scope="col">Serwis</th>
              <th scope="col">Razem</th>
              <th scope="col">Śr. przebieg (km/dzień)</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.month}>
                <th scope="row">{p.label}</th>
                <td>{fullPlnFormatter.format(p.fuel)}</td>
                <td>{fullPlnFormatter.format(p.maintenance)}</td>
                <td>{fullPlnFormatter.format(p.fuel + p.maintenance)}</td>
                <td>{kmPerDayFormatter.format(p.utilization)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </>
  );
}

function MonthlyTrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || payload.length === 0) return null;

  const fuelEntry = payload.find((p) => p.dataKey === "fuel");
  const maintenanceEntry = payload.find((p) => p.dataKey === "maintenance");
  const utilizationEntry = payload.find((p) => p.dataKey === "utilization");
  const fuel = typeof fuelEntry?.value === "number" ? fuelEntry.value : 0;
  const maintenance = typeof maintenanceEntry?.value === "number" ? maintenanceEntry.value : 0;
  const utilization = typeof utilizationEntry?.value === "number" ? utilizationEntry.value : 0;
  const total = fuel + maintenance;

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="200px">
        <Text size="2" weight="bold">
          {label}
        </Text>
        <CostRow color={FUEL_COLOR} label="Paliwo" value={fullPlnFormatter.format(fuel)} />
        <CostRow
          color={MAINTENANCE_COLOR}
          label="Serwis"
          value={fullPlnFormatter.format(maintenance)}
        />
        <Text size="1" color="gray">
          Razem: <Text weight="bold">{fullPlnFormatter.format(total)}</Text>
        </Text>
        <CostRow
          color={UTILIZATION_COLOR}
          label="Śr. przebieg"
          value={`${kmPerDayFormatter.format(utilization)} km/dzień`}
        />
      </Flex>
    </Card>
  );
}

function CostRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <Flex gap="2" align="center" justify="between">
      <Flex gap="2" align="center">
        <Box width="8px" height="8px" style={{ background: color, borderRadius: "2px" }} />
        <Text size="1" color="gray">
          {label}
        </Text>
      </Flex>
      <Text size="1" weight="medium">
        {value}
      </Text>
    </Flex>
  );
}
