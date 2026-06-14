import { DataList, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

export interface DataPair {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

function isPrimitive(value: ReactNode): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

export function ResponsiveDataList({ items }: { items: DataPair[] }) {
  return (
    <>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-4 sm:hidden">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex flex-col gap-1 ${item.fullWidth ? "col-span-2" : ""}`}
          >
            <dt className="m-0">
              <Text size="1" color="gray" weight="medium">
                {item.label}
              </Text>
            </dt>
            <dd className="m-0">
              {isPrimitive(item.value) ? <Text size="2">{item.value}</Text> : item.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="hidden sm:block">
        <DataList.Root orientation="horizontal">
          {items.map((item) => (
            <DataList.Item key={item.label}>
              <DataList.Label>{item.label}</DataList.Label>
              <DataList.Value>{item.value}</DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>
      </div>
    </>
  );
}
