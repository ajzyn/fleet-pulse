import { describe, expect, it } from "vitest";
import { updateVehiclePlateSchema } from "./update-plate.schema.server";

const VALID_ID = "00000000-0000-4000-8000-000000000001";
const VALID_UPDATED_AT = "2026-01-15T10:00:00.000Z";

const buildInput = (overrides: Record<string, unknown> = {}) => ({
  id: VALID_ID,
  plateNumber: "ABC1234",
  updatedAt: VALID_UPDATED_AT,
  ...overrides,
});

describe("updateVehiclePlateSchema", () => {
  describe("valid input", () => {
    it("accepts a fully-formed payload", () => {
      const result = updateVehiclePlateSchema.safeParse(buildInput());

      expect(result.success).toBe(true);
    });

    it("coerces updatedAt from ISO string (FormData arrives as string)", () => {
      const result = updateVehiclePlateSchema.safeParse(buildInput());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt.toISOString()).toBe(VALID_UPDATED_AT);
      }
    });

    it("trims surrounding whitespace from plateNumber", () => {
      const result = updateVehiclePlateSchema.safeParse(buildInput({ plateNumber: "  XYZ987  " }));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plateNumber).toBe("XYZ987");
      }
    });
  });

  describe("invalid input", () => {
    it.each<[string, Record<string, unknown>, "id" | "plateNumber" | "updatedAt"]>([
      ["missing id", { id: undefined }, "id"],
      ["non-uuid id", { id: "not-a-uuid" }, "id"],
      ["empty id", { id: "" }, "id"],
      ["missing plateNumber", { plateNumber: undefined }, "plateNumber"],
      ["empty plateNumber", { plateNumber: "" }, "plateNumber"],
      ["whitespace-only plateNumber", { plateNumber: "   " }, "plateNumber"],
      ["plateNumber over 15 chars", { plateNumber: "A".repeat(16) }, "plateNumber"],
      ["missing updatedAt", { updatedAt: undefined }, "updatedAt"],
      ["unparseable updatedAt", { updatedAt: "tomorrow" }, "updatedAt"],
    ])("rejects %s", (_label, overrides, expectedField) => {
      const result = updateVehiclePlateSchema.safeParse(buildInput(overrides));

      expect(result.success).toBe(false);
      if (!result.success) {
        const failingFields = result.error.issues.map((issue) => issue.path[0]);
        expect(failingFields).toContain(expectedField);
      }
    });
  });
});
