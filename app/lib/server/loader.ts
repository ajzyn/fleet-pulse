import { sanitizeError } from "./log-error.server";

export type LoaderState<T> = { status: "ok"; data: T } | { status: "error"; message: string };

export const settledToLoaderState = <T>(result: PromiseSettledResult<T>): LoaderState<T> => {
  if (result.status === "fulfilled") {
    return { status: "ok", data: result.value };
  }

  return { status: "error", message: sanitizeError(result.reason) };
};
