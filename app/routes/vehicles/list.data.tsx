import { data } from "react-router";
import { ZodError } from "zod";
import { parseVehiclesQuery } from "~/features/vehicles/list/server/list.params.server";
import { listVehicles } from "~/features/vehicles/list/server/list.repository.server";
import type { Route } from "./+types/list.data";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const query = parseVehiclesQuery(new URL(request.url));
    return await listVehicles(query);
  } catch (error) {
    if (error instanceof ZodError) return data(null, { status: 400 });
    throw error;
  }
}
