import type { Table as TanstackTable } from "@tanstack/react-table";
import { createContext, useContext } from "react";

type AnyTable = TanstackTable<unknown>;

export const TableCtx = createContext<AnyTable | null>(null);

export const useDataTable = () => {
  const t = useContext(TableCtx);
  if (!t) throw new Error("DataTable.* components must be used inside <DataTable.Root>");
  return t;
};

export const ScrollCtx = createContext<HTMLDivElement | null | undefined>(undefined);

export const useScrollElement = () => {
  const v = useContext(ScrollCtx);
  if (v === undefined) {
    throw new Error("This component must be used inside <DataTable.Viewport>");
  }
  return v;
};
