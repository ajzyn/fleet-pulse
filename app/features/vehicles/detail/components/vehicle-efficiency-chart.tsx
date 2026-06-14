import { InfoCircledIcon } from "@radix-ui/react-icons";
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
import type { EfficiencyPointView } from "../types";

const CHART_HEIGHT = 240;
const CHART_HEIGHT_CLASS = "h-[240px]";
const EFFICIENCY_COLOR = "var(--grass-9)";

const oneDecimalFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

export function VehicleEfficiencyChart({
  points,
  hasData,
}: {
  points: EfficiencyPointView[];
  hasData: boolean;
}) {
  return (
    <Card size="3" asChild>
      <section aria-label="Efektywność paliwowa">
        <Heading as="h2" size="4" mb="4">
          Efektywność paliwowa (l/100 km)
        </Heading>
        {hasData ? (
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
                  tickFormatter={(v: number) => oneDecimalFormatter.format(v)}
                  tick={{ fill: "var(--gray-11)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--gray-a5)" }}
                  width={36}
                />
                <Tooltip content={EfficiencyTooltip} cursor={{ stroke: "var(--gray-a5)" }} />
                <Line
                  dataKey="lPer100"
                  type="monotone"
                  stroke={EFFICIENCY_COLOR}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Flex className={CHART_HEIGHT_CLASS} align="center" justify="center" gap="2">
            <InfoCircledIcon color="gray" />
            <Text size="2" color="gray">
              Brak danych o zużyciu paliwa
            </Text>
          </Flex>
        )}
        <VisuallyHidden>
          <table>
            <caption>Miesięczne zużycie paliwa pojazdu w litrach na 100 km</caption>
            <thead>
              <tr>
                <th scope="col">Miesiąc</th>
                <th scope="col">Zużycie (l/100 km)</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <th scope="row">{p.label}</th>
                  <td>{p.lPer100 === null ? "—" : oneDecimalFormatter.format(p.lPer100)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VisuallyHidden>
      </section>
    </Card>
  );
}

function EfficiencyTooltip(props: TooltipContentProps) {
  if (!isTooltipVisible(props)) return null;

  const value = valueByDataKey(props.payload, "lPer100");

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="150px">
        <Text size="2" weight="bold">
          {props.label}
        </Text>
        <Flex gap="2" align="center" justify="between">
          <Text size="1" color="gray">
            Zużycie
          </Text>
          <Text size="1" weight="medium">
            {oneDecimalFormatter.format(value)} l/100 km
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}
