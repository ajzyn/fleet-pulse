import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Page } from "~/lib/server/pagination";
import { useLoadMoreList } from "./use-load-more-list";

afterEach(cleanup);

interface Row {
  id: string;
}

const ENDPOINT = "/resource";

interface LoaderState {
  calls: { cursor: string | null }[];
  response: (cursor: string | null) => Page<Row> | Response;
}

let loaderState: LoaderState;

beforeEach(() => {
  loaderState = {
    calls: [],
    response: () => ({ items: [], nextCursor: null }),
  };
});

const resourceLoader = ({ request }: { request: Request }) => {
  const cursor = new URL(request.url).searchParams.get("cursor");
  loaderState.calls.push({ cursor });
  return loaderState.response(cursor);
};

interface HarnessProps<T> {
  initial: Page<T>;
  resetKey: string | number;
}

const Harness = ({ initial, resetKey }: HarnessProps<Row>) => {
  const list = useLoadMoreList<Row>({ endpoint: ENDPOINT, initial, resetKey });

  return (
    <div>
      <ul aria-label="items">
        {list.items.map((row) => (
          <li key={row.id}>{row.id}</li>
        ))}
      </ul>
      <span data-testid="count">{list.items.length}</span>
      <span data-testid="hasMore">{String(list.hasMore)}</span>
      <span data-testid="isLoadingMore">{String(list.isLoadingMore)}</span>
      <span data-testid="error">{String(list.error)}</span>
      <span data-testid="total">{String(list.total)}</span>
      <button
        type="button"
        onClick={() => {
          list.loadMore();
        }}
      >
        loadMore
      </button>
      <button
        type="button"
        onClick={() => {
          list.retry();
        }}
      >
        retry
      </button>
    </div>
  );
};

const renderHarness = (props: HarnessProps<Row>) => {
  const Stub = createRoutesStub([
    { path: "/", Component: () => <Harness {...props} /> },
    { path: ENDPOINT, loader: resourceLoader },
  ]);

  const utils = render(<Stub initialEntries={["/"]} />);

  const rerender = (next: HarnessProps<Row>) => {
    const NextStub = createRoutesStub([
      { path: "/", Component: () => <Harness {...next} /> },
      { path: ENDPOINT, loader: resourceLoader },
    ]);
    utils.rerender(<NextStub initialEntries={["/"]} />);
  };

  return { ...utils, rerender };
};

const rows = (...ids: string[]): Row[] => ids.map((id) => ({ id }));

describe("useLoadMoreList", () => {
  it("renders the initial items", () => {
    renderHarness({
      initial: { items: rows("a", "b"), nextCursor: "c1", total: 5 },
      resetKey: "k",
    });

    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByTestId("hasMore").textContent).toBe("true");
    expect(screen.getByTestId("total").textContent).toBe("5");
  });

  it("appends the next page and reflects the new cursor in hasMore", async () => {
    loaderState.response = () => ({ items: rows("c", "d"), nextCursor: null, total: 4 });

    renderHarness({
      initial: { items: rows("a", "b"), nextCursor: "c1", total: 4 },
      resetKey: "k",
    });

    fireEvent.click(screen.getByText("loadMore"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("4");
    });

    expect(loaderState.calls).toEqual([{ cursor: "c1" }]);
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.getByText("d")).toBeInTheDocument();
    expect(screen.getByTestId("hasMore").textContent).toBe("false");
  });

  it("resets items and cursor when resetKey changes", async () => {
    const { rerender } = renderHarness({
      initial: { items: rows("a", "b"), nextCursor: "c1", total: 4 },
      resetKey: "first",
    });

    expect(screen.getByTestId("count").textContent).toBe("2");

    rerender({
      initial: { items: rows("x"), nextCursor: null, total: 1 },
      resetKey: "second",
    });

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });

    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    expect(screen.getByTestId("hasMore").textContent).toBe("false");
    expect(screen.getByTestId("total").textContent).toBe("1");
  });

  it("surfaces error on failed fetch and recovers on retry", async () => {
    loaderState.response = () => new Response(null, { status: 500 });

    renderHarness({
      initial: { items: rows("a"), nextCursor: "c1", total: 3 },
      resetKey: "k",
    });

    fireEvent.click(screen.getByText("loadMore"));

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("true");
    });
    expect(screen.getByTestId("count").textContent).toBe("1");

    loaderState.response = () => ({ items: rows("b", "c"), nextCursor: null, total: 3 });

    fireEvent.click(screen.getByText("retry"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("3");
    });
    expect(screen.getByTestId("error").textContent).toBe("false");
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
  });

  it("deduplicates repeated loadMore for the same cursor", async () => {
    loaderState.response = () => ({ items: rows("c", "d"), nextCursor: null, total: 4 });

    renderHarness({
      initial: { items: rows("a", "b"), nextCursor: "c1", total: 4 },
      resetKey: "k",
    });

    const loadMore = screen.getByText("loadMore");
    fireEvent.click(loadMore);
    fireEvent.click(loadMore);
    fireEvent.click(loadMore);

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("4");
    });

    expect(loaderState.calls).toEqual([{ cursor: "c1" }]);
  });
});
