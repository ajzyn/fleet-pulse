CREATE TYPE "public"."driver_status" AS ENUM('active', 'on_leave', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('diesel', 'petrol', 'electric', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'completed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('oil_change', 'tire_rotation', 'inspection', 'repair', 'accident');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'in_maintenance', 'retired');--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"license_number" text NOT NULL,
	"hire_date" date NOT NULL,
	"status" "driver_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_email_unique" UNIQUE("email"),
	CONSTRAINT "drivers_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "fuel_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"transaction_at" timestamp with time zone NOT NULL,
	"liters" numeric(8, 2) NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"mileage_at_fillup_km" integer NOT NULL,
	"station_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"type" "maintenance_type" NOT NULL,
	"status" "maintenance_status" NOT NULL,
	"mileage_at_event_km" integer NOT NULL,
	"cost" numeric(10, 2),
	"workshop_name" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"start_mileage_km" integer NOT NULL,
	"end_mileage_km" integer NOT NULL,
	"distance_km" numeric(8, 2) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"idle_minutes" integer DEFAULT 0 NOT NULL,
	"avg_speed_kmh" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin" text NOT NULL,
	"plate_number" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"status" "vehicle_status" DEFAULT 'active' NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"current_mileage_km" integer DEFAULT 0 NOT NULL,
	"last_service_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_vin_unique" UNIQUE("vin"),
	CONSTRAINT "vehicles_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
ALTER TABLE "fuel_transactions" ADD CONSTRAINT "fuel_transactions_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fuel_vehicle_transaction_idx" ON "fuel_transactions" USING btree ("vehicle_id","transaction_at");--> statement-breakpoint
CREATE INDEX "maintenance_vehicle_event_idx" ON "maintenance_events" USING btree ("vehicle_id","event_at");--> statement-breakpoint
CREATE INDEX "maintenance_status_event_idx" ON "maintenance_events" USING btree ("status","event_at");--> statement-breakpoint
CREATE INDEX "trips_vehicle_started_idx" ON "trips" USING btree ("vehicle_id","started_at");--> statement-breakpoint
CREATE INDEX "trips_driver_started_idx" ON "trips" USING btree ("driver_id","started_at");--> statement-breakpoint
CREATE INDEX "assignments_vehicle_from_idx" ON "vehicle_assignments" USING btree ("vehicle_id","from_date");--> statement-breakpoint
CREATE INDEX "assignments_driver_from_idx" ON "vehicle_assignments" USING btree ("driver_id","from_date");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_one_active_per_vehicle" ON "vehicle_assignments" USING btree ("vehicle_id") WHERE "vehicle_assignments"."to_date" IS NULL;