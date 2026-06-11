import { useRef, useState } from "react";
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

  const requestedCursor = useRef<string | null>(null);

  const loadMore = () => {
    if (cursor === null) return;
    if (fetcher.state !== "idle") return;
    setError(false);
    requestedCursor.current = cursor;
    const sp = new URLSearchParams({ cursor });
    void fetcher.load(`${endpoint}?${sp.toString()}`);
  };

  const retry = () => {
    const target = requestedCursor.current ?? cursor;
    if (target === null) return;
    if (fetcher.state !== "idle") return;
    setError(false);
    const sp = new URLSearchParams({ cursor: target });
    void fetcher.load(`${endpoint}?${sp.toString()}`);
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
