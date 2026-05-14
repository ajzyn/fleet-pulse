import { data } from "react-router";
import z from "zod";
import { ActionErrorKind } from "~/lib/action";
import { updateVehicleStatus } from "./update-status.repository";
import { updateVehicleStatusSchema } from "./update-status.schema";

export async function handleUpdateStatus(formData: FormData) {
  const parsed = updateVehicleStatusSchema.safeParse(Object.fromEntries(formData));

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

  const result = await updateVehicleStatus(parsed.data);

  if (result.ok) return data(result);

  if (result.kind === ActionErrorKind.NotFound) return data(result, { status: 404 });

  return data(result, { status: 409 });
}
