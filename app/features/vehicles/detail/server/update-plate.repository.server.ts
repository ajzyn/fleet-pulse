import { db } from "@db/client";
import { vehicles, type Vehicle } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { ActionErrorKind, type ActionErr, type ActionResult } from "~/lib/server/action";
import type { VehiclePlateUpdate } from "./update-plate.schema.server";

export type UpdatePlateResult = ActionResult<
  { vehicle: Vehicle },
  | ActionErr<typeof ActionErrorKind.Conflict, { current: Vehicle }>
  | ActionErr<typeof ActionErrorKind.NotFound>
  | ActionErr<typeof ActionErrorKind.Validation, { plateNumber: string[] }>
>;

const isUniqueViolation = (error: unknown): boolean => {
  for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
    if ("code" in cause && (cause as { code?: unknown }).code === "23505") return true;
  }
  return false;
};

export const updateVehiclePlate = async (input: VehiclePlateUpdate): Promise<UpdatePlateResult> => {
  try {
    const [updated] = await db
      .update(vehicles)
      .set({ plateNumber: input.plateNumber })
      .where(and(eq(vehicles.id, input.id), eq(vehicles.updatedAt, input.updatedAt)))
      .returning();

    if (updated) {
      return { ok: true, payload: { vehicle: updated } };
    }

    const [current] = await db.select().from(vehicles).where(eq(vehicles.id, input.id));

    if (!current) {
      return { ok: false, kind: ActionErrorKind.NotFound };
    }

    return { ok: false, kind: ActionErrorKind.Conflict, payload: { current } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        kind: ActionErrorKind.Validation,
        payload: { plateNumber: ["Ta tablica jest już zajęta"] },
      };
    }
    throw error;
  }
};
