import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AttentionData, AttentionItem } from "../server/attention/types";
import { useNeedsAttention } from "./use-needs-attention";

vi.mock("react-router", async (importActual) => ({
  ...(await importActual<typeof import("react-router")>()),
  useRevalidator: () => ({ revalidate: vi.fn() }),
}));

const item = (overrides: Partial<AttentionItem> = {}): AttentionItem => ({
  vehicleId: "veh-1",
  plateNumber: "WX 12345",
  make: "Toyota",
  model: "Corolla",
  status: "active",
  chips: [],
  severityScore: 0,
  ...overrides,
});

const okState = (data: AttentionData) => ({ status: "ok", data }) as const;

describe("useNeedsAttention", () => {
  it("orders chips within an item by severity tone (critical first)", () => {
    const state = okState({
      items: [
        item({
          chips: ["idle_too_long", "cost_anomaly", "overdue_maintenance", "maintenance_due_soon"],
        }),
      ],
      totalCount: 1,
    });

    const { result } = renderHook(() => useNeedsAttention(state));
    if (result.current.status !== "success") throw new Error("expected success state");

    const firstItem = result.current.items[0];
    expect(firstItem?.chips.map((c) => c.kind)).toEqual([
      "overdue_maintenance",
      "cost_anomaly",
      "maintenance_due_soon",
      "idle_too_long",
    ]);
    expect(firstItem?.topTone).toBe("critical");
  });

  it("links each item to its vehicle detail page", () => {
    const state = okState({ items: [item({ vehicleId: "abc" })], totalCount: 1 });
    const { result } = renderHook(() => useNeedsAttention(state));
    if (result.current.status !== "success") throw new Error("expected success state");
    expect(result.current.items[0]?.href).toBe("/vehicles/abc");
  });

  it("falls back to the info tone for an item without chips", () => {
    const state = okState({ items: [item({ chips: [] })], totalCount: 1 });
    const { result } = renderHook(() => useNeedsAttention(state));
    if (result.current.status !== "success") throw new Error("expected success state");
    expect(result.current.items[0]?.topTone).toBe("info");
  });

  it("flags overflow when more vehicles need attention than are listed", () => {
    const state = okState({ items: [item()], totalCount: 25 });
    const { result } = renderHook(() => useNeedsAttention(state));
    if (result.current.status !== "success") throw new Error("expected success state");
    expect(result.current.hasOverflow).toBe(true);
    expect(result.current.totalCount).toBe(25);
  });

  it("does not flag overflow when every needing vehicle is listed", () => {
    const state = okState({
      items: [item(), item({ vehicleId: "v2" })],
      totalCount: 2,
    });
    const { result } = renderHook(() => useNeedsAttention(state));
    if (result.current.status !== "success") throw new Error("expected success state");
    expect(result.current.hasOverflow).toBe(false);
  });

  it("returns an empty state when no vehicle needs attention", () => {
    const { result } = renderHook(() => useNeedsAttention(okState({ items: [], totalCount: 0 })));
    expect(result.current.status).toBe("empty");
  });

  it("surfaces the loader error message", () => {
    const { result } = renderHook(() =>
      useNeedsAttention({ status: "error", message: "Baza nie odpowiada" }),
    );
    if (result.current.status !== "error") throw new Error("expected error state");
    expect(result.current.message).toBe("Baza nie odpowiada");
  });
});
