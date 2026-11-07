import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { UniformAlgorithm } from "../../../src/modules/distribution/core/uniform/algorithm";
import { UniformValidator } from "../../../src/modules/distribution/core/uniform/validator";

describe("distribution.uniform", () => {
  describe("algorithm", () => {
    it("source = 0.5, min = 10, max = 20. should return exactly the midpoint", () => {
      const algorithm = new UniformAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ min: 10, max: 20 })).toBe(15);
    });

    it("source = 0, min = 10, max = 20. should return exactly min", () => {
      const algorithm = new UniformAlgorithm({ next: () => 0 });

      expect(algorithm.execute({ min: 10, max: 20 })).toBe(10);
    });

    it("source = 0.25, min = -4, max = 4. should return exactly -2", () => {
      const algorithm = new UniformAlgorithm({ next: () => 0.25 });

      expect(algorithm.execute({ min: -4, max: 4 })).toBe(-2);
    });
  });

  describe("validator", () => {
    it("min = 20, max = 10. should throw a ChacaError with the exact message", () => {
      const validator = new UniformValidator();

      expect(() => validator.execute({ min: 20, max: 10 })).toThrow(ChacaError);
      expect(() => validator.execute({ min: 20, max: 10 })).toThrow(
        "Max 10 should be greater than min 20.",
      );
    });

    it("min = 10, max = 20. should not throw", () => {
      const validator = new UniformValidator();

      expect(() => validator.execute({ min: 10, max: 20 })).not.toThrow();
    });

    it("min = max = 5. should not throw", () => {
      const validator = new UniformValidator();

      expect(() => validator.execute({ min: 5, max: 5 })).not.toThrow();
    });
  });
});
