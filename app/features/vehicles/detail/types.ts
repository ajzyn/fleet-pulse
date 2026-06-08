import type { Vehicle } from "@db/schema";

export interface VehicleHeaderView {
  title: string;
  plateNumber: string;
  status: Vehicle["status"];
  vin: string;
  year: number;
  fuelLabel: string;
  mileage: string;
  lastService: string;
  driver: string;
  purchaseDate: string;
  purchasePrice: string;
}
