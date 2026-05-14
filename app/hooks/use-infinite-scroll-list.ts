import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

interface PageableQuery {
  page: number;
  pageSize: number;
}

export interface InfiniteScrollLoaderData<T, Q> {
  rows: T[];
  total: number;
  query: Q;
}

interface UseInfiniteScrollListOptions<T, Q extends PageableQuery> {
  loaderData: InfiniteScrollLoaderData<T, Q>;
  filtersEqual: (a: Q, b: Q) => boolean;
}

export const useInfiniteScrollList = <T, Q extends PageableQuery>({
  loaderData,
  filtersEqual,
}: UseInfiniteScrollListOptions<T, Q>) => {
  const fetcher = useFetcher<InfiniteScrollLoaderData<T, Q>>();
  const isFetchingRef = useRef(false);

  const [rows, setRows] = useState<T[]>(loaderData.rows);
  const [lastSyncedLoaderRows, setLastSyncedLoaderRows] = useState(loaderData.rows);
  const [lastProcessedData, setLastProcessedData] = useState(fetcher.data);
  const [prevFetcherState, setPrevFetcherState] = useState(fetcher.state);
  const [hasError, setHasError] = useState(false);

  if (loaderData.rows !== lastSyncedLoaderRows) {
    setLastSyncedLoaderRows(loaderData.rows);
    setRows(loaderData.rows);
    setLastProcessedData(fetcher.data);
  }

  if (fetcher.state !== prevFetcherState) {
    setPrevFetcherState(fetcher.state);
    if (prevFetcherState === "loading" && fetcher.state === "idle" && !fetcher.data) {
      setHasError(true);
    }
  }

  useEffect(() => {
    if (fetcher.state === "idle") {
      isFetchingRef.current = false;
    }
  }, [fetcher.state]);

  if (fetcher.data !== lastProcessedData) {
    setLastProcessedData(fetcher.data);
    const data = fetcher.data;
    if (data && filtersEqual(data.query, loaderData.query)) {
      setRows((prev) => [...prev, ...data.rows]);
    }
  }

  const loadNextPage = () => {
    if (rows.length >= loaderData.total) return;
    if (fetcher.state !== "idle") return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setHasError(false);
    const nextPage = Math.ceil(rows.length / loaderData.query.pageSize) + 1;
    const sp = new URLSearchParams(window.location.search);
    sp.set("page", String(nextPage));
    void fetcher.load(`${window.location.pathname}?${sp.toString()}`);
  };

  return {
    rows,
    total: loaderData.total,
    isLoading: fetcher.state === "loading",
    hasError,
    loadNextPage,
  };
};
