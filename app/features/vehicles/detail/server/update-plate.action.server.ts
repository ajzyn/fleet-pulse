import { data } from "react-router";
import z from "zod";
import { ActionErrorKind } from "~/lib/server/action";
import { updateVehiclePlate } from "./update-plate.repository.server";
import { updateVehiclePlateSchema } from "./update-plate.schema.server";

export async function handleUpdatePlate(formData: FormData) {
  const parsed = updateVehiclePlateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data(
      {
        ok: false,
        kind: ActionErrorKind.Validation,
        payload: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await updateVehiclePlate(parsed.data);

  if (result.ok) return data(result);

  if (result.kind === ActionErrorKind.NotFound) return data(result, { status: 404 });

  return data(result, { status: 409 });
}
