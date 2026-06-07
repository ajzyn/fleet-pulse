import { Box } from "@radix-ui/themes";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

const DEFAULT_COLOR = "var(--gray-a9)";

export function Sparkline({ data, color = DEFAULT_COLOR }: SparklineProps) {
  if (data.length === 0) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <Box aria-hidden width="100%" height="100%">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 0, height: 32 }}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.15}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
