export type LoaderState<T> = { status: "ok"; data: T } | { status: "error"; message: string };

export const settledToLoaderState = <T>(result: PromiseSettledResult<T>): LoaderState<T> => {
  if (result.status === "fulfilled") {
    return { status: "ok", data: result.value };
  }

  return {
    status: "error",
    message: result.reason instanceof Error ? result.reason.message : "Nie udało się pobrać danych",
  };
};
