import { Flex, Skeleton, Table, Text } from "@radix-ui/themes";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useDataTable, useScrollElement } from "./context";

interface VirtualizedBodyProps {
  isLoading?: boolean;
  loadingSkeletonRows?: number;
  estimatedRowHeight?: number;
  overscan?: number;
  emptyMessage?: ReactNode;
}

export function VirtualizedBody({
  isLoading = false,
  loadingSkeletonRows = 3,
  estimatedRowHeight = 45,
  overscan = 10,
  emptyMessage = "No results",
}: VirtualizedBodyProps) {
  const table = useDataTable();
  const scrollEl = useScrollElement();
  const rows = table.getRowModel().rows;
  const leafColumns = table.getVisibleLeafColumns();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => estimatedRowHeight,
    overscan,
    initialRect: { width: 0, height: 650 },
  });

  if (rows.length === 0 && !isLoading) {
    return (
      <Flex align="center" justify="center" height="200px">
        <Text size="2" color="gray">
          {emptyMessage}
        </Text>
      </Flex>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();
  const padTop = virtualItems[0]?.start ?? 0;
  const last = virtualItems[virtualItems.length - 1];
  const padBottom = last ? rowVirtualizer.getTotalSize() - last.end : 0;
  const firstHeaderGroup = table.getHeaderGroups()[0];

  return (
    <div style={{ height: rowVirtualizer.getTotalSize() }}>
      <Table.Root style={{ tableLayout: "fixed", width: "100%" }}>
        {firstHeaderGroup && (
          <colgroup>
            {firstHeaderGroup.headers.map((header) => (
              <col key={header.id} style={{ width: header.getSize() }} />
            ))}
          </colgroup>
        )}
        <Table.Body>
          {padTop > 0 && <tr style={{ height: `${padTop.toString()}px` }} />}

          {virtualItems.map((vRow) => {
            const row = rows[vRow.index];
            if (!row) return null;
            return (
              <Table.Row key={row.id} data-index={vRow.index}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}

          {isLoading &&
            Array.from({ length: loadingSkeletonRows }, (_, i) => (
              <Table.Row key={`skeleton-${i.toString()}`}>
                {leafColumns.map((col) => (
                  <Table.Cell key={col.id}>
                    <Skeleton height="16px" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}

          {padBottom > 0 && <tr style={{ height: `${padBottom.toString()}px` }} />}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
