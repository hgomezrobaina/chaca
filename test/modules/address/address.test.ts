import { modules } from "../../../src";
import { describe, expect, it } from "vitest";

function countDecimals(value: number): number {
  const decimals = String(value).split(".")[1];
  return decimals ? decimals.length : 0;
}

describe("# Address module test", () => {
  it("address.countryCode", () => {
    const value = modules.address.countryCode();
    const codes = modules.address.constants.countriesCode;

    expect(codes.includes(value)).toBe(true);
  });

  it("address.timeZone", () => {
    const value = modules.address.timeZone();
    const constants = modules.address.constants.timeZones;

    expect(constants.includes(value)).toBe(true);
  });

  it("address.cardinalDirection", () => {
    const value = modules.address.cardinalDirection();
    const constants = modules.address.constants.cardinalDirections.en;

    expect(constants.includes(value)).toBe(true);
  });

  describe("address.zipCode tests", () => {
    it("no arguments. should return a code with 5 numbers", () => {
      const value = modules.address.zipCode();

      expect(value).toMatch(/^\d{5}$/);
    });

    it("format = ###. should return a code with 3 numbers", () => {
      const value = modules.address.zipCode({ format: "###" });

      expect(value).toMatch(/^\d{3}$/);
    });
  });

  it("address.ordinalDirection", () => {
    const value = modules.address.ordinalDirection();

    expect(modules.address.constants.ordinalDirection.en.includes(value)).toBe(
      true,
    );
  });

  describe("address.latitude tests", () => {
    it("no arguments. should return a number between -90 and 90", () => {
      for (let i = 0; i < 500; i++) {
        const value = modules.address.latitude();

        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThanOrEqual(-90);
        expect(value).toBeLessThanOrEqual(90);
      }
    });

    it("min = 0, max = 10, precision = 2. should return a number between 0 and 10 with at most 2 decimals", () => {
      for (let i = 0; i < 500; i++) {
        const value = modules.address.latitude({
          min: 0,
          max: 10,
          precision: 2,
        });

        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10);
        expect(countDecimals(value)).toBeLessThanOrEqual(2);
      }
    });
  });

  describe("address.longitude tests", () => {
    it("no arguments. should return a number between -180 and 180", () => {
      for (let i = 0; i < 500; i++) {
        const value = modules.address.longitude();

        expect(typeof value).toBe("number");
        expect(value).toBeGreaterThanOrEqual(-180);
        expect(value).toBeLessThanOrEqual(180);
      }
    });
  });

  describe("address.country tests", () => {
    it("no params. should return any country", () => {
      const value = modules.address.country();
      const countries = modules.address.constants.countries.en.map(
        (c) => c.country,
      );
      expect(countries.includes(value)).toBe(true);
    });

    it("continent = 'Europe'. should return a europe country", () => {
      const value = modules.address.country({ continent: "Europe" });
      const countries = modules.address.constants.countries.en
        .filter((c) => c.continent === "Europe")
        .map((c) => c.country);
      expect(countries.includes(value)).toBe(true);
    });

    it("continent = 'Oceania'. should return an oceania country", () => {
      const value = modules.address.country({ continent: "Oceania" });
      const countries = modules.address.constants.countries.en
        .filter((c) => c.continent === "Oceania")
        .map((c) => c.country);
      expect(countries.includes(value)).toBe(true);
    });

    it("continent = 'Antarctica'. should return an antarctica country", () => {
      const value = modules.address.country({ continent: "Antarctica" });
      const countries = modules.address.constants.countries.en
        .filter((c) => c.continent === "Antarctica")
        .map((c) => c.country);
      expect(countries.includes(value)).toBe(true);
    });

    it("country = no valid country. should return any country", () => {
      const value = modules.address.country({ continent: "hi" as any });
      const countries = modules.address.constants.countries.en.map(
        (c) => c.country,
      );
      expect(countries.includes(value)).toBe(true);
    });
  });
});
