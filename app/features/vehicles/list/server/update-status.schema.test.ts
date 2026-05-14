import { describe, expect, it } from "vitest";
import { updateVehicleStatusSchema } from "./update-status.schema";

const VALID_ID = "00000000-0000-4000-8000-000000000001";
const VALID_UPDATED_AT = "2026-01-15T10:00:00.000Z";

const buildInput = (overrides: Record<string, unknown> = {}) => ({
  id: VALID_ID,
  status: "active",
  updatedAt: VALID_UPDATED_AT,
  ...overrides,
});

describe("updateVehicleStatusSchema", () => {
  describe("valid input", () => {
    it("accepts a fully-formed payload", () => {
      const result = updateVehicleStatusSchema.safeParse(buildInput());

      expect(result.success).toBe(true);
    });

    it("coerces updatedAt from ISO string (FormData arrives as string)", () => {
      const result = updateVehicleStatusSchema.safeParse(buildInput());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt.toISOString()).toBe(VALID_UPDATED_AT);
      }
    });

    it.each(["active", "in_maintenance", "retired"] as const)("accepts status=%s", (status) => {
      const result = updateVehicleStatusSchema.safeParse(buildInput({ status }));

      expect(result.success).toBe(true);
    });
  });

  describe("invalid input", () => {
    it.each<[string, Record<string, unknown>, "id" | "status" | "updatedAt"]>([
      ["missing id", { id: undefined }, "id"],
      ["non-uuid id", { id: "not-a-uuid" }, "id"],
      ["empty id", { id: "" }, "id"],
      ["missing status", { status: undefined }, "status"],
      ["unknown status", { status: "unknown" }, "status"],
      ["missing updatedAt", { updatedAt: undefined }, "updatedAt"],
      ["unparseable updatedAt", { updatedAt: "tomorrow" }, "updatedAt"],
    ])("rejects %s", (_label, overrides, expectedField) => {
      const result = updateVehicleStatusSchema.safeParse(buildInput(overrides));

      expect(result.success).toBe(false);
      if (!result.success) {
        const failingFields = result.error.issues.map((issue) => issue.path[0]);
        expect(failingFields).toContain(expectedField);
      }
    });
  });
});
