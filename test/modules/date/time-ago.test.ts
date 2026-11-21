import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

const ITERATIONS = 200;

const UNIT_RANGES = {
  days: { min: 1, max: 30 },
  hours: { min: 1, max: 23 },
  minutes: { min: 1, max: 59 },
  seconds: { min: 1, max: 59 },
  years: { min: 1, max: 40 },
  months: { min: 1, max: 11 },
} as const;

describe("date.timeAgo", () => {
  for (const [unit, range] of Object.entries(UNIT_RANGES)) {
    it(`unit = '${unit}'. should match '<n> ${unit} ago' with n within [${range.min}, ${range.max}]`, () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = modules.date.timeAgo({
          unit: unit as keyof typeof UNIT_RANGES,
        });

        expect(value).toMatch(new RegExp(`^\\d+ ${unit} ago$`));

        const amount = Number(value.split(" ")[0]);
        expect(amount).toBeGreaterThanOrEqual(range.min);
        expect(amount).toBeLessThanOrEqual(range.max);
      }
    });
  }

  it("no arguments. should return a string with a valid unit", () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const value = modules.date.timeAgo();

      expect(value).toMatch(
        /^\d+ (years|seconds|minutes|days|hours|months) ago$/,
      );
    }
  });

  it("unit outside the known set (e.g. from an untyped caller). should echo it back, not the literal word 'undefined'", () => {
    const value = modules.date.timeAgo({ unit: "fortnights" as any });

    expect(value).toMatch(/^\d+ fortnights ago$/);
  });
});
