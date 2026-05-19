import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from "@radix-ui/react-icons";
import { Flex, Table } from "@radix-ui/themes";
import { flexRender, type Header } from "@tanstack/react-table";
import type { CSSProperties } from "react";
import { useDataTable } from "./context";

interface SortableHeaderCellProps {
  header: Header<unknown, unknown>;
  style?: CSSProperties;
}

function SortableHeaderCell({ header, style }: SortableHeaderCellProps) {
  const canSort = header.column.getCanSort();
  const dir = header.column.getIsSorted();
  const handleToggle = canSort ? header.column.getToggleSortingHandler() : undefined;
  const ariaSort =
    dir === "asc" ? "ascending" : dir === "desc" ? "descending" : canSort ? "none" : undefined;

  return (
    <Table.ColumnHeaderCell
      onClick={handleToggle}
      onKeyDown={
        canSort
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggle?.(e);
              }
            }
          : undefined
      }
      tabIndex={canSort ? 0 : undefined}
      aria-sort={ariaSort}
      style={{ cursor: canSort ? "pointer" : undefined, userSelect: "none", ...style }}
    >
      <Flex align="center" gap="1">
        {flexRender(header.column.columnDef.header, header.getContext())}
        {canSort &&
          (dir === "asc" ? (
            <CaretUpIcon />
          ) : dir === "desc" ? (
            <CaretDownIcon />
          ) : (
            <CaretSortIcon style={{ opacity: 0.4 }} />
          ))}
      </Flex>
    </Table.ColumnHeaderCell>
  );
}

interface HeaderRowsProps {
  fixedWidths?: boolean;
}

export function HeaderRows({ fixedWidths = false }: HeaderRowsProps) {
  const table = useDataTable();
  return (
    <Table.Header>
      {table.getHeaderGroups().map((hg) => (
        <Table.Row key={hg.id}>
          {hg.headers.map((header) => (
            <SortableHeaderCell
              key={header.id}
              header={header}
              {...(fixedWidths ? { style: { width: header.getSize() } } : {})}
            />
          ))}
        </Table.Row>
      ))}
    </Table.Header>
  );
}

export function StickyHeader() {
  return (
    <Table.Root style={{ tableLayout: "fixed", width: "100%", flexShrink: 0 }}>
      <HeaderRows fixedWidths />
    </Table.Root>
  );
}
