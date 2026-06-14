import { fuelType, vehicleStatus } from "@db/schema";
import z from "zod";

const SortField = z.enum(["year", "mileage", "make", "lastService"]);
const SortDir = z.enum(["asc", "desc", "none"]);

const SortSchema = z
  .string()
  .optional()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const [rawField, rawDir] = value.split(":");
    const field = SortField.safeParse(rawField);
    const dir = SortDir.safeParse(rawDir);
    if (!field.success || !dir.success) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid sort "${value}". Expected "<field>:<asc|desc>".`,
      });
      return z.NEVER;
    }
    return { field: field.data, dir: dir.data };
  });

const ListVehiclesQuery = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().min(10).max(200).default(24),
  sort: SortSchema,
  status: z.enum(vehicleStatus.enumValues).optional(),
  fuelType: z.enum(fuelType.enumValues).optional(),
  q: z.string().min(1).max(100).optional(),
});

export const parseVehiclesQuery = (url: URL) => {
  return ListVehiclesQuery.parse(Object.fromEntries(url.searchParams));
};

export type VehiclesQuery = z.infer<typeof ListVehiclesQuery>;
