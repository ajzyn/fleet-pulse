import type { Table as TanstackTable } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { TableCtx } from "./context";

interface RootProps<T> {
  table: TanstackTable<T>;
  children: ReactNode;
}

export function Root<T>({ table, children }: RootProps<T>) {
  return <TableCtx.Provider value={table as TanstackTable<unknown>}>{children}</TableCtx.Provider>;
}
