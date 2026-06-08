import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "@radix-ui/react-icons";
import { Badge } from "@radix-ui/themes";

type Direction = "up" | "down" | "neutral";

export interface DeltaBadgeProps {
  value: number;
  format: "percent" | "absolute";
  unit?: string;
  goodDirection: Direction;
}

const directionOf = (value: number): Direction =>
  value > 0 ? "up" : value < 0 ? "down" : "neutral";

const colorOf = (
  direction: Direction,
  goodDirection: DeltaBadgeProps["goodDirection"],
): "green" | "red" | "gray" => {
  if (direction === "neutral" || goodDirection === "neutral") return "gray";
  return direction === goodDirection ? "green" : "red";
};

const percentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const absoluteFormatter = new Intl.NumberFormat("pl-PL", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 0,
});

const DIRECTION_LABEL: Record<Direction, string> = {
  up: "wzrost",
  down: "spadek",
  neutral: "brak zmian",
};

const SENTIMENT_LABEL = { green: "pozytywny", red: "negatywny", gray: "neutralny" } as const;

export function DeltaBadge({ value, format, unit, goodDirection }: DeltaBadgeProps) {
  const direction = directionOf(value);
  const color = colorOf(direction, goodDirection);
  const formatted =
    format === "percent" ? percentFormatter.format(value) : absoluteFormatter.format(value);
  const display = unit ? `${formatted} ${unit}` : formatted;
  const Icon = direction === "up" ? ArrowUpIcon : direction === "down" ? ArrowDownIcon : MinusIcon;

  return (
    <Badge
      color={color}
      variant="soft"
      radius="full"
      aria-label={`${DIRECTION_LABEL[direction]} ${display}, ${SENTIMENT_LABEL[color]}`}
    >
      <Icon aria-hidden focusable={false} />
      {display}
    </Badge>
  );
}
