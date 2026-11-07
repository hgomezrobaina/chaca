import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { LogNormalAlgorithm } from "../../../src/modules/distribution/core/log-normal/algorithm";
import { LogNormalValidator } from "../../../src/modules/distribution/core/log-normal/validator";

describe("distribution.logNormal", () => {
  describe("algorithm", () => {
    it("is exactly exp(normal(mean, standardDeviation)) for the same source", () => {
      // Pair (0.6, 0.6) -> x = 0.2, y = 0.2, s = 0.08 < 1. Accepted on the first try.
      const source = { next: () => 0.6 };

      const result = new LogNormalAlgorithm(source).execute({
        mean: 0,
        standardDeviation: 1,
      });

      const s = 0.08;
      const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
      const normalValue = 0.2 * multiplier;

      expect(result).toBeCloseTo(Math.exp(normalValue), 12);
    });

    it("the result is always positive, even for a negative mean", () => {
      const source = { next: () => 0.6 };

      const result = new LogNormalAlgorithm(source).execute({
        mean: -10,
        standardDeviation: 1,
      });

      expect(result).toBeGreaterThan(0);
    });
  });

  describe("validator", () => {
    it("standardDeviation = 0. should throw a ChacaError with the exact message", () => {
      const validator = new LogNormalValidator();

      expect(() => validator.execute({ standardDeviation: 0 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ standardDeviation: 0 })).toThrow(
        "standardDeviation must be greater than 0.",
      );
    });

    it("standardDeviation = 1. should not throw", () => {
      const validator = new LogNormalValidator();

      expect(() => validator.execute({ standardDeviation: 1 })).not.toThrow();
    });
  });
});
