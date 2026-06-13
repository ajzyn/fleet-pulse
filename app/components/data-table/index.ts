import { Body, PlainTable } from "./body";
import { ErrorRow } from "./error-row";
import { HeaderRows, StickyHeader } from "./header";
import { LoadMoreTrigger } from "./load-more-trigger";
import { Pagination } from "./pagination";
import { Root } from "./root";

export const DataTable = {
  Root,
  Table: PlainTable,
  Header: HeaderRows,
  Body,
  StickyHeader,
  LoadMoreTrigger,
  ErrorRow,
  Pagination,
};
