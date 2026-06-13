import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderInTheme } from "~/test/render";
import { VehicleCard, type CardVehicle } from "./vehicles-cards";

afterEach(cleanup);

const vehicle = {
  id: "v1",
  plateNumber: "R5DK3UR",
  make: "Hyundai",
  model: "El Camino",
  year: 2024,
  currentMileageKm: 74630,
  fuelType: "diesel",
} satisfies CardVehicle;

describe("VehicleCard", () => {
  it("shows the plate, make/model/year, mileage and fuel for a vehicle", () => {
    renderInTheme(<VehicleCard vehicle={vehicle} statusSlot={<span>Active</span>} />);

    expect(screen.getByText("R5DK3UR")).toBeInTheDocument();
    expect(screen.getByText("Hyundai El Camino - 2024")).toBeInTheDocument();
    expect(screen.getByText(/630\s*km/)).toBeInTheDocument();
    expect(screen.getByText("Diesel")).toBeInTheDocument();
  });

  it("renders the status slot passed by the caller", () => {
    renderInTheme(<VehicleCard vehicle={vehicle} statusSlot={<span>Active</span>} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("labels the card for assistive tech with make, model and plate", () => {
    renderInTheme(<VehicleCard vehicle={vehicle} statusSlot={<span>Active</span>} />);
    expect(screen.getByRole("article", { name: "Hyundai El Camino, R5DK3UR" })).toBeInTheDocument();
  });
});
