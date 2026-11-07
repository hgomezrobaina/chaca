import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { GeometricAlgorithm } from "../../../src/modules/distribution/core/geometric/algorithm";
import { GeometricValidator } from "../../../src/modules/distribution/core/geometric/validator";

describe("distribution.geometric", () => {
  describe("algorithm", () => {
    it("source = 0.5, probability = 0.3. should return exactly ceil(ln(0.5) / ln(0.7))", () => {
      const algorithm = new GeometricAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ probability: 0.3 })).toBe(
        Math.ceil(Math.log(0.5) / Math.log(0.7)),
      );
    });

    it("probability = 1. should always return 1, regardless of the source", () => {
      const algorithm = new GeometricAlgorithm({ next: () => 0.9999 });

      expect(algorithm.execute({ probability: 1 })).toBe(1);
    });

    it("source = 0 (the formula's own edge case). should still return the support's minimum of 1, not 0", () => {
      const algorithm = new GeometricAlgorithm({ next: () => 0 });

      expect(algorithm.execute({ probability: 0.5 })).toBe(1);
    });
  });

  describe("validator", () => {
    it("probability = 0. should throw a ChacaError with the exact message", () => {
      const validator = new GeometricValidator();

      expect(() => validator.execute({ probability: 0 })).toThrow(ChacaError);
      expect(() => validator.execute({ probability: 0 })).toThrow(
        "probability must be greater than 0 and less than or equal to 1.",
      );
    });

    it("probability = 1.5. should throw a ChacaError", () => {
      const validator = new GeometricValidator();

      expect(() => validator.execute({ probability: 1.5 })).toThrow(ChacaError);
    });

    it("probability = 1. should not throw", () => {
      const validator = new GeometricValidator();

      expect(() => validator.execute({ probability: 1 })).not.toThrow();
    });
  });
});
