import type { Vehicle } from "@db/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionErrorKind } from "~/lib/server/action";

vi.mock("./update-status.repository", () => ({
  updateVehicleStatus: vi.fn(),
}));

const { updateVehicleStatus } = await import("./update-status.repository.server");
const { handleUpdateStatus } = await import("./update-status.action.server");

const updateVehicleStatusMock = vi.mocked(updateVehicleStatus);

const VALID_ID = "00000000-0000-4000-8000-000000000001";
const VALID_UPDATED_AT = "2026-01-15T10:00:00.000Z";

const buildFormData = (overrides: Record<string, string | undefined> = {}) => {
  const fields: Record<string, string | undefined> = {
    id: VALID_ID,
    status: "active",
    updatedAt: VALID_UPDATED_AT,
    ...overrides,
  };

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) formData.set(key, value);
  }
  return formData;
};

const buildVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: VALID_ID,
  vin: "1HGCM82633A004352",
  plateNumber: "ABC123",
  make: "Toyota",
  model: "Corolla",
  year: 2022,
  fuelType: "petrol",
  status: "active",
  purchaseDate: "2022-01-01",
  purchasePrice: "20000.00",
  currentMileageKm: 12000,
  lastServiceAt: null,
  createdAt: new Date(VALID_UPDATED_AT),
  updatedAt: new Date(VALID_UPDATED_AT),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleUpdateStatus", () => {
  describe("when input is invalid", () => {
    it("returns 400 with field errors on id and skips the repository", async () => {
      const response = await handleUpdateStatus(buildFormData({ id: "not-a-uuid" }));

      expect(response.init?.status).toBe(400);
      const body = response.data;
      expect.assert(!body.ok && body.kind === ActionErrorKind.Validation);
      expect(body.payload.id).toBeDefined();
      expect(Array.isArray(body.payload.id)).toBe(true);
      expect(updateVehicleStatusMock).not.toHaveBeenCalled();
    });

    it("returns 400 with field errors on status and skips the repository", async () => {
      const response = await handleUpdateStatus(buildFormData({ status: "exploded" }));

      expect(response.init?.status).toBe(400);
      const body = response.data;
      expect.assert(!body.ok && body.kind === ActionErrorKind.Validation);
      expect(body.payload.status).toBeDefined();
      expect(Array.isArray(body.payload.status)).toBe(true);
      expect(updateVehicleStatusMock).not.toHaveBeenCalled();
    });
  });

  describe("when input is valid", () => {
    it("passes the parsed payload to the repository (updatedAt as Date)", async () => {
      updateVehicleStatusMock.mockResolvedValueOnce({
        ok: true,
        payload: { vehicle: buildVehicle({ status: "in_maintenance" }) },
      });

      await handleUpdateStatus(buildFormData({ status: "in_maintenance" }));

      expect(updateVehicleStatusMock).toHaveBeenCalledTimes(1);
      expect(updateVehicleStatusMock).toHaveBeenCalledWith({
        id: VALID_ID,
        status: "in_maintenance",
        updatedAt: new Date(VALID_UPDATED_AT),
      });
    });

    it("returns 200 (no explicit status) with the updated vehicle on success", async () => {
      const vehicle = buildVehicle({ status: "in_maintenance" });
      updateVehicleStatusMock.mockResolvedValueOnce({ ok: true, payload: { vehicle } });

      const response = await handleUpdateStatus(buildFormData({ status: "in_maintenance" }));

      expect(response.init?.status).toBeUndefined();
      expect(response.data).toEqual({ ok: true, payload: { vehicle } });
    });

    it("returns 404 when the repository reports NotFound", async () => {
      updateVehicleStatusMock.mockResolvedValueOnce({
        ok: false,
        kind: ActionErrorKind.NotFound,
      });

      const response = await handleUpdateStatus(buildFormData());

      expect(response.init?.status).toBe(404);
      expect(response.data).toEqual({ ok: false, kind: ActionErrorKind.NotFound });
    });

    it("returns 409 with the current vehicle on optimistic-concurrency conflict", async () => {
      const current = buildVehicle({ status: "retired" });
      updateVehicleStatusMock.mockResolvedValueOnce({
        ok: false,
        kind: ActionErrorKind.Conflict,
        payload: { current },
      });

      const response = await handleUpdateStatus(buildFormData());

      expect(response.init?.status).toBe(409);
      expect(response.data).toEqual({
        ok: false,
        kind: ActionErrorKind.Conflict,
        payload: { current },
      });
    });
  });
});
