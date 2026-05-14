import type { SortingState, Updater } from "@tanstack/react-table";
import { useCallback } from "react";
import { useSearchParams } from "react-router";

function parseSortParam(raw: string | null): SortingState {
  if (!raw) return [];
  const [field, dir] = raw.split(":");
  if (!field || (dir !== "asc" && dir !== "desc")) return [];
  return [{ id: field, desc: dir === "desc" }];
}

export const useTableUrlParams = <K extends string>() => {
  const [, setSearchParams] = useSearchParams();

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((params) => {
        params.set("page", page.toString());
        return params;
      });
    },
    [setSearchParams],
  );

  const setFilter = useCallback(
    (key: K, value: string | undefined) => {
      setSearchParams(
        (params) => {
          if (value === undefined || value === "") params.delete(key);
          else params.set(key, value);
          params.set("page", "1");
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (updater: Updater<SortingState>) => {
      setSearchParams(
        (params) => {
          const current = parseSortParam(params.get("sort"));
          const next = typeof updater === "function" ? updater(current) : updater;
          const first = next[0];
          if (!first) params.delete("sort");
          else params.set("sort", `${first.id}:${first.desc ? "desc" : "asc"}`);
          params.set("page", "1");
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { setFilter, setSort, setPage };
};
