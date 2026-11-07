import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { ParetoAlgorithm } from "../../../src/modules/distribution/core/pareto/algorithm";
import { ParetoValidator } from "../../../src/modules/distribution/core/pareto/validator";

describe("distribution.pareto", () => {
  describe("algorithm", () => {
    it("source = 0.5, scale = 3, shape = 5. should return exactly 3 / 0.5^(1/5)", () => {
      const algorithm = new ParetoAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ scale: 3, shape: 5 })).toBeCloseTo(
        3 / Math.pow(0.5, 1 / 5),
        12,
      );
    });

    it("source = 0, scale = 3, shape = 5. should return exactly scale", () => {
      const algorithm = new ParetoAlgorithm({ next: () => 0 });

      expect(algorithm.execute({ scale: 3, shape: 5 })).toBe(3);
    });
  });

  describe("validator", () => {
    it("scale = 0. should throw a ChacaError with the exact message", () => {
      const validator = new ParetoValidator();

      expect(() => validator.execute({ scale: 0, shape: 1 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ scale: 0, shape: 1 })).toThrow(
        "scale must be greater than 0.",
      );
    });

    it("shape = 0. should throw a ChacaError with the exact message", () => {
      const validator = new ParetoValidator();

      expect(() => validator.execute({ scale: 1, shape: 0 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ scale: 1, shape: 0 })).toThrow(
        "shape must be greater than 0.",
      );
    });

    it("scale = 1, shape = 1. should not throw", () => {
      const validator = new ParetoValidator();

      expect(() => validator.execute({ scale: 1, shape: 1 })).not.toThrow();
    });
  });
});
