import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      clearTimeout(t);
    };
  }, [value, delay]);
  return debounced;
};

export const useDebouncedSearchParam = (key: string, current: string, delay = 300) => {
  const [draft, setDraft] = useState(current);
  const [lastSyncedCurrent, setLastSyncedCurrent] = useState(current);
  if (current !== lastSyncedCurrent) {
    setLastSyncedCurrent(current);
    setDraft(current);
  }

  const debounced = useDebouncedValue(draft, delay);
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (debounced === current) return;
    setSearchParams(
      (params) => {
        if (debounced) params.set(key, debounced);
        else params.delete(key);
        params.set("page", "1");
        return params;
      },
      { replace: true },
    );
  }, [debounced, current, key, setSearchParams]);

  return [draft, setDraft] as const;
};
