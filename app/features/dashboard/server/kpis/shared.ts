import { subDays } from "date-fns";

export type DeltaDirection = "up" | "down" | "flat";

export const computeDeltaWithPercentage = (current: number, prior: number) => {
  const absolute = current - prior;
  const percentage = prior > 0 ? (absolute / prior) * 100 : 0;
  const direction: DeltaDirection =
    Math.abs(percentage) < 1 ? "flat" : absolute > 0 ? "up" : "down";
  return { absolute, percentage, direction };
};

export const buildRollingSparkline = (
  days: number,
  valueAtKey: (key: string) => number,
  today: Date = new Date(),
): number[] => {
  const sparkline: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    sparkline.push(valueAtKey(date.toISOString().slice(0, 10)));
  }
  return sparkline;
};
