import { relations, sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const vehicleStatus = pgEnum("vehicle_status", ["active", "in_maintenance", "retired"]);

export const driverStatus = pgEnum("driver_status", ["active", "on_leave", "terminated"]);

export const fuelType = pgEnum("fuel_type", ["diesel", "petrol", "electric", "hybrid"]);

export const maintenanceType = pgEnum("maintenance_type", [
  "oil_change",
  "tire_rotation",
  "inspection",
  "repair",
  "accident",
]);

export const maintenanceStatus = pgEnum("maintenance_status", [
  "scheduled",
  "completed",
  "overdue",
]);

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  vin: text("vin").notNull().unique(),
  plateNumber: text("plate_number").notNull().unique(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  fuelType: fuelType("fuel_type").notNull(),
  status: vehicleStatus("status").notNull().default("active"),
  purchaseDate: date("purchase_date").notNull(),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
  currentMileageKm: integer("current_mileage_km").notNull().default(0),
  lastServiceAt: timestamp("last_service_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  licenseNumber: text("license_number").notNull().unique(),
  hireDate: date("hire_date").notNull(),
  status: driverStatus("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vehicleAssignments = pgTable(
  "vehicle_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("assignments_vehicle_from_idx").on(table.vehicleId, table.fromDate),
    index("assignments_driver_from_idx").on(table.driverId, table.fromDate),
    uniqueIndex("assignments_one_active_per_vehicle")
      .on(table.vehicleId)
      .where(sql`${table.toDate} IS NULL`),
  ],
);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    startMileageKm: integer("start_mileage_km").notNull(),
    endMileageKm: integer("end_mileage_km").notNull(),
    distanceKm: numeric("distance_km", { precision: 8, scale: 2 }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    idleMinutes: integer("idle_minutes").notNull().default(0),
    avgSpeedKmh: numeric("avg_speed_kmh", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("trips_vehicle_started_idx").on(table.vehicleId, table.startedAt),
    index("trips_driver_started_idx").on(table.driverId, table.startedAt),
  ],
);

export const fuelTransactions = pgTable(
  "fuel_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    transactionAt: timestamp("transaction_at", { withTimezone: true }).notNull(),
    liters: numeric("liters", { precision: 8, scale: 2 }).notNull(),
    cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
    mileageAtFillupKm: integer("mileage_at_fillup_km").notNull(),
    stationName: text("station_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("fuel_vehicle_transaction_idx").on(table.vehicleId, table.transactionAt)],
);

export const maintenanceEvents = pgTable(
  "maintenance_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    eventAt: timestamp("event_at", { withTimezone: true }).notNull(),
    type: maintenanceType("type").notNull(),
    status: maintenanceStatus("status").notNull(),
    mileageAtEventKm: integer("mileage_at_event_km").notNull(),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    workshopName: text("workshop_name"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("maintenance_vehicle_event_idx").on(table.vehicleId, table.eventAt),
    index("maintenance_status_event_idx").on(table.status, table.eventAt),
  ],
);

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  trips: many(trips),
  fuelTransactions: many(fuelTransactions),
  maintenanceEvents: many(maintenanceEvents),
  assignments: many(vehicleAssignments),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  trips: many(trips),
  assignments: many(vehicleAssignments),
}));

export const vehicleAssignmentsRelations = relations(vehicleAssignments, ({ one }) => ({
  vehicle: one(vehicles, { fields: [vehicleAssignments.vehicleId], references: [vehicles.id] }),
  driver: one(drivers, { fields: [vehicleAssignments.driverId], references: [drivers.id] }),
}));

export const tripsRelations = relations(trips, ({ one }) => ({
  vehicle: one(vehicles, { fields: [trips.vehicleId], references: [vehicles.id] }),
  driver: one(drivers, { fields: [trips.driverId], references: [drivers.id] }),
}));

export const fuelTransactionsRelations = relations(fuelTransactions, ({ one }) => ({
  vehicle: one(vehicles, { fields: [fuelTransactions.vehicleId], references: [vehicles.id] }),
}));

export const maintenanceEventsRelations = relations(maintenanceEvents, ({ one }) => ({
  vehicle: one(vehicles, { fields: [maintenanceEvents.vehicleId], references: [vehicles.id] }),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

export type FuelTransaction = typeof fuelTransactions.$inferSelect;
export type NewFuelTransaction = typeof fuelTransactions.$inferInsert;

export type MaintenanceEvent = typeof maintenanceEvents.$inferSelect;
export type NewMaintenanceEvent = typeof maintenanceEvents.$inferInsert;

export type VehicleAssignment = typeof vehicleAssignments.$inferSelect;
export type NewVehicleAssignment = typeof vehicleAssignments.$inferInsert;
