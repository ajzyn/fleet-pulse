import { ExclamationTriangleIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Heading, Skeleton, Text, VisuallyHidden } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import {
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import type { CostBreakdownDonutState, CostBreakdownSliceView } from "../types";

const CHART_HEIGHT_CLASS = "h-[180px] sm:h-[280px]";

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

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function CostBreakdownDonut({ state }: { state: CostBreakdownDonutState }) {
  return (
    <Card size="3" asChild>
      <section aria-label="Struktura kosztów w bieżącym miesiącu">
        <Heading as="h2" size="4" mb="4">
          Struktura kosztów w tym miesiącu
        </Heading>
        <CostBreakdownContent state={state} />
      </section>
    </Card>
  );
}

function CostBreakdownContent({ state }: { state: CostBreakdownDonutState }) {
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

  return <CostBreakdownBody slices={state.slices} total={state.total} />;
}

function CostBreakdownBody({ slices, total }: { slices: CostBreakdownSliceView[]; total: number }) {
  const navigate = useNavigate();

  const data = slices.map((slice) => ({ ...slice, fill: slice.color }));

  const handleSliceClick = (_data: unknown, index: number) => {
    const slice = slices[index];
    if (!slice) return;
    void navigate(`/costs?category=${slice.category}`);
  };

  return (
    <>
      <Box className={CHART_HEIGHT_CLASS}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 0, height: 180 }}
        >
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--color-panel-solid)"
              strokeWidth={2}
              style={{ cursor: "pointer" }}
              onClick={handleSliceClick}
              isAnimationActive={false}
            >
              <Label content={CenterLabel} position="center" value={total} />
            </Pie>
            <Tooltip content={CostBreakdownTooltip} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value: string) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <VisuallyHidden>
        <table>
          <caption>Struktura kosztów floty w bieżącym miesiącu, w PLN</caption>
          <thead>
            <tr>
              <th scope="col">Kategoria</th>
              <th scope="col">Kwota</th>
              <th scope="col">Udział</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((slice) => (
              <tr key={slice.category}>
                <th scope="row">{slice.label}</th>
                <td>{fullPlnFormatter.format(slice.amount)}</td>
                <td>{percentFormatter.format(slice.percentage / 100)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Razem</th>
              <td>{fullPlnFormatter.format(total)}</td>
              <td>{percentFormatter.format(1)}</td>
            </tr>
          </tbody>
        </table>
      </VisuallyHidden>
    </>
  );
}

function CostBreakdownTooltip({ active, payload }: TooltipContentProps) {
  if (!active || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry) return null;

  const amount = typeof entry.value === "number" ? entry.value : 0;
  const label = typeof entry.name === "string" ? entry.name : "";
  const color = entry.color ?? "var(--gray-9)";
  const share = readSlicePercentage(entry.payload);

  return (
    <Card size="1" className="shadow-lg">
      <Flex direction="column" gap="1" minWidth="180px">
        <Flex gap="2" align="center">
          <Box width="8px" height="8px" style={{ background: color, borderRadius: "2px" }} />
          <Text size="2" weight="bold">
            {label}
          </Text>
        </Flex>
        <Flex justify="between" gap="3">
          <Text size="1" color="gray">
            Kwota
          </Text>
          <Text size="1" weight="medium">
            {fullPlnFormatter.format(amount)}
          </Text>
        </Flex>
        <Flex justify="between" gap="3">
          <Text size="1" color="gray">
            Udział
          </Text>
          <Text size="1" weight="medium">
            {percentFormatter.format(share)}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

function readSlicePercentage(payload: unknown): number {
  if (typeof payload !== "object" || payload === null) return 0;
  if (!("percentage" in payload)) return 0;
  const value = payload.percentage;
  return typeof value === "number" ? value / 100 : 0;
}

function CenterLabel({ viewBox, value }: { viewBox?: unknown; value?: unknown }) {
  if (
    !viewBox ||
    typeof viewBox !== "object" ||
    !("cx" in viewBox) ||
    !("cy" in viewBox) ||
    typeof viewBox.cx !== "number" ||
    typeof viewBox.cy !== "number"
  ) {
    return null;
  }
  const total = typeof value === "number" ? value : 0;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="var(--gray-12)"
        fontSize={22}
        fontWeight={600}
      >
        {compactPlnFormatter.format(total)}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--gray-10)" fontSize={11}>
        Razem w tym miesiącu
      </text>
    </g>
  );
}
