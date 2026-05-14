import { Body, PlainTable } from "./body";
import { ErrorRow } from "./error-row";
import { Frame, Viewport } from "./frame";
import { HeaderRows, StickyHeader } from "./header";
import { LoadMoreTrigger } from "./load-more-trigger";
import { Pagination } from "./pagination";
import { Root } from "./root";
import { VirtualizedBody } from "./virtualized-body";

export const DataTable = {
  Root,
  Table: PlainTable,
  Header: HeaderRows,
  Body,
  StickyHeader,
  Frame,
  Viewport,
  VirtualizedBody,
  LoadMoreTrigger,
  ErrorRow,
  Pagination,
};
