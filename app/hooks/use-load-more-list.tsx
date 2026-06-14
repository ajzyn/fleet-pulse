import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { Page } from "~/lib/server/pagination";

interface UseLoadMoreListOptions<T> {
  endpoint: string;
  initial: Page<T>;
  resetKey?: string | number;
}

export interface UseLoadMoreListResult<T> {
  items: T[];
  total: number | undefined;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: boolean;
  loadMore: () => void;
  retry: () => void;
}

export const useLoadMoreList = <T,>({
  endpoint,
  initial,
  resetKey,
}: UseLoadMoreListOptions<T>): UseLoadMoreListResult<T> => {
  const fetcher = useFetcher<Page<T>>();
  const requestedCursor = useRef<string | null>(null);

  const [items, setItems] = useState<T[]>(initial.items);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor);
  const [total, setTotal] = useState<number | undefined>(initial.total);

  const [resetSnapshot, setResetSnapshot] = useState(resetKey);
  const [lastProcessed, setLastProcessed] = useState(fetcher.data);
  const [prevState, setPrevState] = useState(fetcher.state);
  const [error, setError] = useState(false);

  if (resetKey !== resetSnapshot) {
    setResetSnapshot(resetKey);
    setItems(initial.items);
    setCursor(initial.nextCursor);
    setTotal(initial.total);
    setError(false);
    setLastProcessed(fetcher.data);
  }

  useEffect(() => {
    requestedCursor.current = null;
  }, [resetKey]);

  if (fetcher.state !== prevState) {
    setPrevState(fetcher.state);
    if (prevState === "loading" && fetcher.state === "idle" && !fetcher.data) {
      setError(true);
    }
  }

  if (fetcher.data && fetcher.data !== lastProcessed) {
    setLastProcessed(fetcher.data);
    const page = fetcher.data;
    setItems((prev) => [...prev, ...page.items]);
    setCursor(page.nextCursor);
    if (page.total !== undefined) setTotal(page.total);
  }

  const buildUrl = (target: string) => {
    const [path = "", qs] = endpoint.split("?");
    const sp = new URLSearchParams(qs);
    sp.set("cursor", target);
    return `${path}?${sp}`;
  };

  const loadMore = () => {
    if (cursor === null) return;
    if (fetcher.state !== "idle") return;
    if (!error && requestedCursor.current === cursor) return;
    setError(false);
    requestedCursor.current = cursor;
    void fetcher.load(buildUrl(cursor));
  };

  const retry = () => {
    const target = requestedCursor.current ?? cursor;
    if (target === null) return;
    if (fetcher.state !== "idle") return;
    setError(false);
    void fetcher.load(buildUrl(target));
  };

  return {
    items,
    total,
    hasMore: cursor !== null,
    isLoadingMore: fetcher.state === "loading",
    error,
    loadMore,
    retry,
  };
};
