import { describe, expect, it } from "vitest";
import z from "zod";
import { parseVehiclesQuery } from "./list.query";

const url = (search: string) => new URL(`http://localhost/vehicles${search}`);

describe("parseVehiclesQuery", () => {
  describe("defaults", () => {
    it("returns page=1, pageSize=50 and no filters for an empty URL", () => {
      expect(parseVehiclesQuery(url(""))).toEqual({
        page: 1,
        pageSize: 50,
        sort: undefined,
      });
    });
  });

  describe("valid input", () => {
    it("parses page, status and sort together", () => {
      expect(parseVehiclesQuery(url("?page=2&status=active&sort=mileage:asc"))).toEqual({
        page: 2,
        pageSize: 50,
        sort: { field: "mileage", dir: "asc" },
        status: "active",
      });
    });

    it("parses fuelType and q together", () => {
      expect(parseVehiclesQuery(url("?fuelType=electric&q=tesla"))).toEqual({
        page: 1,
        pageSize: 50,
        sort: undefined,
        fuelType: "electric",
        q: "tesla",
      });
    });

    it.each(["asc", "desc", "none"] as const)("accepts sort direction=%s", (dir) => {
      expect(parseVehiclesQuery(url(`?sort=year:${dir}`)).sort).toEqual({
        field: "year",
        dir,
      });
    });

    it.each([10, 50, 200])("accepts pageSize=%i at the boundary", (pageSize) => {
      expect(parseVehiclesQuery(url(`?pageSize=${String(pageSize)}`)).pageSize).toBe(pageSize);
    });
  });

  describe("invalid input — pagination", () => {
    it.each<[string, string]>([
      ["page=0 (below min)", "?page=0"],
      ["negative page", "?page=-1"],
      ["non-numeric page", "?page=abc"],
      ["pageSize below min", "?pageSize=5"],
      ["pageSize above max (DoS guard)", "?pageSize=10000"],
    ])("rejects %s", (_label, search) => {
      expect(() => parseVehiclesQuery(url(search))).toThrow(z.ZodError);
    });
  });

  describe("invalid input — filters", () => {
    it.each<[string, string]>([
      ["unknown status", "?status=foo"],
      ["unknown fuelType", "?fuelType=oil"],
      ["empty q", "?q="],
      ["q above max length (DoS guard)", `?q=${"a".repeat(101)}`],
    ])("rejects %s", (_label, search) => {
      expect(() => parseVehiclesQuery(url(search))).toThrow(z.ZodError);
    });
  });

  describe("invalid input — sort whitelist (ORDER BY injection guard)", () => {
    it.each<[string, string]>([
      ["non-whitelisted field", "?sort=password:asc"],
      ["missing direction", "?sort=year"],
      ["invalid direction", "?sort=year:upward"],
      ["empty field", "?sort=:desc"],
    ])("rejects %s", (_label, search) => {
      expect(() => parseVehiclesQuery(url(search))).toThrow(z.ZodError);
    });
  });
});
