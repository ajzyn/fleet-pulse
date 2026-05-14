import { db } from "@db/client";
import { vehicles, type Vehicle } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { ActionErrorKind, type ActionErr, type ActionResult } from "~/lib/action";
import type { VehicleStatusUpdate } from "./update-status.schema";

export type UpdateStatusResult = ActionResult<
  { vehicle: Vehicle },
  | ActionErr<typeof ActionErrorKind.Conflict, { current: Vehicle }>
  | ActionErr<typeof ActionErrorKind.NotFound>
>;

export const updateVehicleStatus = async (
  input: VehicleStatusUpdate,
): Promise<UpdateStatusResult> => {
  const [updated] = await db
    .update(vehicles)
    .set({ status: input.status })
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
};
