import type { Table as TanstackTable } from "@tanstack/react-table";
import { createContext, useContext } from "react";

type AnyTable = TanstackTable<unknown>;

export const TableCtx = createContext<AnyTable | null>(null);

export const useDataTable = () => {
  const t = useContext(TableCtx);
  if (!t) throw new Error("DataTable.* components must be used inside <DataTable.Root>");
  return t;
};
