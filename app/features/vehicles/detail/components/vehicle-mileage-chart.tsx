import { Box, Card, Flex, Heading, Text, VisuallyHidden } from "@radix-ui/themes";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { isTooltipVisible, valueByDataKey } from "~/lib/recharts/tooltip";
import type { MileagePointView } from "../types";

const CHART_HEIGHT = 240;
const CHART_HEIGHT_CLASS = "h-[240px]";
const MILEAGE_COLOR = "var(--iris-9)";

const kmCompactFormatter = new Intl.NumberFormat("pl-PL", {
  notation: "compact",
  maximumFractionDigits: 0,
});
const kmFormatter = new Intl.NumberFormat("pl-PL");

export function VehicleMileageChart({ points }: { points: MileagePointView[] }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Przebieg w czasie">
        <Heading as="h2" size="4" mb="4">
          Przebieg (12 miesięcy)
        </Heading>
        <Box className={`${CHART_HEIGHT_CLASS} -mx-3 sm:mx-0`}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 0, height: CHART_HEIGHT }}
          >
            <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--gray-a5)" }}
                interval="preserveStartEnd"
                minTickGap={24}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v: number) => kmCompactFormatter.format(v)}
                tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--gray-a5)" }}
                width={44}
              />
              <Tooltip content={MileageTooltip} cursor={{ stroke: "var(--gray-a5)" }} />
              <Line
                dataKey="odometerKm"
                type="monotone"
                stroke={MILEAGE_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <VisuallyHidden>
          <table>
            <caption>Stan licznika pojazdu na koniec miesiąca, w kilometrach</caption>
            <thead>
              <tr>
                <th scope="col">Miesiąc</th>
                <th scope="col">Przebieg (km)</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{p.label}</th>
                  <td>{p.odometerKm === null ? "—" : kmFormatter.format(p.odometerKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VisuallyHidden>
      </section>
    </Card>
  );
}

function MileageTooltip(props: TooltipContentProps) {
  if (!isTooltipVisible(props)) return null;

  const odometer = valueByDataKey(props.payload, "odometerKm");

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="140px">
        <Text size="2" weight="bold">
          {props.label}
        </Text>
        <Flex gap="2" align="center" justify="between">
          <Text size="1" color="gray">
            Przebieg
          </Text>
          <Text size="1" weight="medium">
            {kmFormatter.format(odometer)} km
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
