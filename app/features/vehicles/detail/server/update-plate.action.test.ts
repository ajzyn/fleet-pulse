import type { Vehicle } from "@db/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActionErrorKind } from "~/lib/server/action";

vi.mock("./update-plate.repository.server", () => ({
  updateVehiclePlate: vi.fn(),
}));

const { updateVehiclePlate } = await import("./update-plate.repository.server");
const { handleUpdatePlate } = await import("./update-plate.action.server");

const updateVehiclePlateMock = vi.mocked(updateVehiclePlate);

const VALID_ID = "00000000-0000-4000-8000-000000000001";
const VALID_UPDATED_AT = "2026-01-15T10:00:00.000Z";

const buildFormData = (overrides: Record<string, string | undefined> = {}) => {
  const fields: Record<string, string | undefined> = {
    id: VALID_ID,
    plateNumber: "ABC1234",
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
  plateNumber: "ABC1234",
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

describe("handleUpdatePlate", () => {
  describe("when input is invalid", () => {
    it("returns 400 with field errors on id and skips the repository", async () => {
      const response = await handleUpdatePlate(buildFormData({ id: "not-a-uuid" }));

      expect(response.init?.status).toBe(400);
      const body = response.data;
      expect.assert(!body.ok && body.kind === ActionErrorKind.Validation && "id" in body.payload);
      expect(body.payload.id).toBeDefined();
      expect(updateVehiclePlateMock).not.toHaveBeenCalled();
    });

    it("returns 400 with field errors on empty plateNumber and skips the repository", async () => {
      const response = await handleUpdatePlate(buildFormData({ plateNumber: "" }));

      expect(response.init?.status).toBe(400);
      const body = response.data;
      expect.assert(!body.ok && body.kind === ActionErrorKind.Validation);
      expect(body.payload.plateNumber).toBeDefined();
      expect(updateVehiclePlateMock).not.toHaveBeenCalled();
    });
  });

  describe("when input is valid", () => {
    it("passes the parsed payload to the repository (updatedAt as Date, plateNumber trimmed)", async () => {
      updateVehiclePlateMock.mockResolvedValueOnce({
        ok: true,
        payload: { vehicle: buildVehicle({ plateNumber: "NEW999" }) },
      });

      await handleUpdatePlate(buildFormData({ plateNumber: "  NEW999  " }));

      expect(updateVehiclePlateMock).toHaveBeenCalledTimes(1);
      expect(updateVehiclePlateMock).toHaveBeenCalledWith({
        id: VALID_ID,
        plateNumber: "NEW999",
        updatedAt: new Date(VALID_UPDATED_AT),
      });
    });

    it("returns 200 with the updated vehicle on success", async () => {
      const vehicle = buildVehicle({ plateNumber: "NEW999" });
      updateVehiclePlateMock.mockResolvedValueOnce({ ok: true, payload: { vehicle } });

      const response = await handleUpdatePlate(buildFormData({ plateNumber: "NEW999" }));

      expect(response.init?.status).toBeUndefined();
      expect(response.data).toEqual({ ok: true, payload: { vehicle } });
    });

    it("returns 404 when the repository reports NotFound", async () => {
      updateVehiclePlateMock.mockResolvedValueOnce({ ok: false, kind: ActionErrorKind.NotFound });

      const response = await handleUpdatePlate(buildFormData());

      expect(response.init?.status).toBe(404);
      expect(response.data).toEqual({ ok: false, kind: ActionErrorKind.NotFound });
    });

    it("returns 409 with the current vehicle on optimistic-concurrency conflict", async () => {
      const current = buildVehicle({ plateNumber: "OTHER1" });
      updateVehiclePlateMock.mockResolvedValueOnce({
        ok: false,
        kind: ActionErrorKind.Conflict,
        payload: { current },
      });

      const response = await handleUpdatePlate(buildFormData());

      expect(response.init?.status).toBe(409);
      expect(response.data).toEqual({
        ok: false,
        kind: ActionErrorKind.Conflict,
        payload: { current },
      });
    });

    it("returns 409 with a plateNumber field error when the plate is already taken", async () => {
      updateVehiclePlateMock.mockResolvedValueOnce({
        ok: false,
        kind: ActionErrorKind.Validation,
        payload: { plateNumber: ["Ta tablica jest już zajęta"] },
      });

      const response = await handleUpdatePlate(buildFormData());

      expect(response.init?.status).toBe(409);
      const body = response.data;
      expect.assert(!body.ok && body.kind === ActionErrorKind.Validation);
      expect(body.payload.plateNumber).toEqual(["Ta tablica jest już zajęta"]);
    });
  });
});
