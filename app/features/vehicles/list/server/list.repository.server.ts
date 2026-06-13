import { db } from "@db/client";
import { vehicles, type Vehicle } from "@db/schema";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { buildOffsetPage, decodeOffsetCursor, type Page } from "~/lib/server/pagination";
import type { VehiclesQuery } from "./list.params.server";

const SORT_COLUMNS = {
  year: vehicles.year,
  mileage: vehicles.currentMileageKm,
  make: vehicles.make,
  lastService: vehicles.lastServiceAt,
} as const;

const buildWhere = (query: VehiclesQuery) => {
  const conditions = [];
  if (query.status) {
    conditions.push(eq(vehicles.status, query.status));
  }

  if (query.fuelType) {
    conditions.push(eq(vehicles.fuelType, query.fuelType));
  }

  if (query.q) {
    const q = `%${query.q}%`;
    const search = or(
      ilike(vehicles.make, q),
      ilike(vehicles.model, q),
      ilike(vehicles.vin, q),
      ilike(vehicles.plateNumber, q),
    );

    if (search) {
      conditions.push(search);
    }
  }

  return conditions.length === 0 ? undefined : and(...conditions);
};

export const listVehicles = async (query: VehiclesQuery): Promise<Page<Vehicle>> => {
  const where = buildWhere(query);
  const sortColumn = query.sort ? SORT_COLUMNS[query.sort.field] : vehicles.createdAt;
  const direction = query.sort?.dir === "desc" ? desc : asc;
  const offset = decodeOffsetCursor(query.cursor);

  const [rows, totalResult] = await Promise.all([
    db
      .select()
      .from(vehicles)
      .where(where)
      .orderBy(direction(sortColumn), asc(vehicles.id))
      .limit(query.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(vehicles).where(where),
  ]);

  return buildOffsetPage(rows, offset, totalResult[0]?.value ?? 0);
};
