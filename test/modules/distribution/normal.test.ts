import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { NormalAlgorithm } from "../../../src/modules/distribution/core/normal/algorithm";
import { NormalValidator } from "../../../src/modules/distribution/core/normal/validator";

describe("distribution.normal", () => {
  describe("algorithm", () => {
    it("the first pair falls outside the unit circle. should reject it and use the second", () => {
      // Pair 1: (0.9, 0.9) -> x = 0.8, y = 0.8, s = 1.28 >= 1. Rejected.
      // Pair 2: (0.6, 0.6) -> x = 0.2, y = 0.2, s = 0.08 < 1. Accepted.
      const values = [0.9, 0.9, 0.6, 0.6];
      let calls = 0;
      const source = {
        next: () => {
          const value = values[calls];
          calls += 1;
          return value;
        },
      };

      const algorithm = new NormalAlgorithm(source);
      const result = algorithm.execute({ mean: 0, standardDeviation: 1 });

      const s = 0.08;
      const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
      const expected = 0.2 * multiplier;

      expect(result).toBeCloseTo(expected, 12);
      expect(calls).toBe(4);
    });

    it("s = 0 (both coordinates land on the origin). should reject and retry", () => {
      // Pair 1: (0.5, 0.5) -> x = 0, y = 0, s = 0. Rejected (degenerate).
      // Pair 2: (0.75, 0.5) -> x = 0.5, y = 0, s = 0.25 < 1. Accepted.
      const values = [0.5, 0.5, 0.75, 0.5];
      let calls = 0;
      const source = {
        next: () => {
          const value = values[calls];
          calls += 1;
          return value;
        },
      };

      const algorithm = new NormalAlgorithm(source);
      algorithm.execute({ mean: 0, standardDeviation: 1 });

      expect(calls).toBe(4);
    });

    it("mean and standardDeviation shift and scale the standard result", () => {
      const values = [0.6, 0.6];
      let calls = 0;
      const source = {
        next: () => {
          const value = values[calls % values.length];
          calls += 1;
          return value;
        },
      };

      const standard = new NormalAlgorithm(source).execute({
        mean: 0,
        standardDeviation: 1,
      });
      calls = 0;
      const shifted = new NormalAlgorithm(source).execute({
        mean: 50,
        standardDeviation: 8,
      });

      expect(shifted).toBeCloseTo(50 + 8 * standard, 12);
    });
  });

  describe("validator", () => {
    it("standardDeviation = 0. should throw a ChacaError with the exact message", () => {
      const validator = new NormalValidator();

      expect(() => validator.execute({ standardDeviation: 0 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ standardDeviation: 0 })).toThrow(
        "standardDeviation must be greater than 0.",
      );
    });

    it("standardDeviation = -1. should throw a ChacaError", () => {
      const validator = new NormalValidator();

      expect(() => validator.execute({ standardDeviation: -1 })).toThrow(
        ChacaError,
      );
    });

    it("standardDeviation = 1. should not throw", () => {
      const validator = new NormalValidator();

      expect(() => validator.execute({ standardDeviation: 1 })).not.toThrow();
    });
  });
});
