import { describe, expect, it } from "vitest";
import { modules } from "../../../src";
import {
  VIN_TRANSLITERATION,
  VIN_WEIGHTS,
} from "../../../src/modules/vehicle/constants/vin";

/**
 * Independent re-implementation of the check digit algorithm (ISO 3779 /
 * SAE J853), used to verify that `modules.vehicle.vin` produces a VIN that
 * a real validator would accept, not just one that looks right.
 */
function computeCheckDigit(vin: string): string {
  const sum = [...vin].reduce((acc, char, i) => {
    const value = /\d/.test(char) ? Number(char) : VIN_TRANSLITERATION[char];

    return acc + value * VIN_WEIGHTS[i];
  }, 0);

  const remainder = sum % 11;

  return remainder === 10 ? "X" : String(remainder);
}

describe("vehicle.vin", () => {
  it("returns a 17-character string using only VIN-valid characters", () => {
    const value = modules.vehicle.vin();

    expect(value).toHaveLength(17);
    expect(value).toMatch(/^[A-HJ-NPR-Z0-9]{17}$/);
  });

  it("starts with one of the curated WMI codes", () => {
    const value = modules.vehicle.vin();

    expect(modules.vehicle.constants.wmi).toContain(value.slice(0, 3));
  });

  it("the check digit (position 9) is the one the real algorithm would compute", () => {
    for (let i = 0; i < 50; i++) {
      const value = modules.vehicle.vin();

      const draft = `${value.slice(0, 8)}0${value.slice(9)}`;
      expect(value[8]).toBe(computeCheckDigit(draft));
    }
  });

  it("matches the canonical worked example from ISO 3779 documentation", () => {
    // 1M8GDM9AXKP042788 is the standard example used to illustrate the check
    // digit algorithm; its check digit is 'X'.
    expect(computeCheckDigit("1M8GDM9A0KP042788")).toBe("X");
  });

  describe("year", () => {
    // literal position-10 codes from the ISO 3779 model-year table, checked
    // directly instead of through the module's own offset formula
    it.each([
      [1980, "A"],
      [1988, "J"],
      [1998, "W"],
      [2000, "Y"],
      [2001, "1"],
      [2009, "9"],
      [2010, "A"], // the 30-year cycle wraps back to 'A'
      [2018, "J"],
    ])("encodes model year %i as '%s' at position 10", (year, code) => {
      const value = modules.vehicle.vin({ year });

      expect(value[9]).toBe(code);
    });

    it("without a year, defaults to a plausible recent one", () => {
      const currentYear = new Date().getFullYear();
      const value = modules.vehicle.vin();

      const codesForTheLast25Years = Array.from(
        { length: 25 },
        (_, i) => modules.vehicle.vin({ year: currentYear - i })[9],
      );

      expect(codesForTheLast25Years).toContain(value[9]);
    });
  });
});
