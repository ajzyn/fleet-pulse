import { Flex, Skeleton, Table, Text } from "@radix-ui/themes";
import { flexRender } from "@tanstack/react-table";
import type { PropsWithChildren, ReactNode } from "react";
import { useDataTable } from "./context";

interface BodyProps {
  isLoading?: boolean;
  skeletonRows?: number;
  emptyMessage?: ReactNode;
  rowClassName?: string;
}

export function Body({
  isLoading = false,
  skeletonRows = 10,
  emptyMessage = "No results",
  rowClassName,
}: BodyProps) {
  const table = useDataTable();
  const rows = table.getRowModel().rows;
  const leafColumns = table.getVisibleLeafColumns();

  if (isLoading) {
    return (
      <Table.Body>
        {Array.from({ length: skeletonRows }, (_, i) => (
          <Table.Row key={`skeleton-${i.toString()}`}>
            {leafColumns.map((col) => (
              <Table.Cell key={col.id}>
                <Skeleton height="16px" />
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    );
  }

  if (rows.length === 0) {
    return (
      <Table.Body>
        <Table.Row>
          <Table.Cell colSpan={leafColumns.length}>
            <Flex justify="center" py="4">
              <Text size="2" color="gray">
                {emptyMessage}
              </Text>
            </Flex>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    );
  }

  return (
    <Table.Body>
      {rows.map((row) => (
        <Table.Row key={row.id} className={rowClassName}>
          {row.getVisibleCells().map((cell) => (
            <Table.Cell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function PlainTable({ children }: PropsWithChildren) {
  return <Table.Root>{children}</Table.Root>;
}
