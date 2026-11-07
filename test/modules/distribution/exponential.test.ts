import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import { ExponentialAlgorithm } from "../../../src/modules/distribution/core/exponential/algorithm";
import { ExponentialValidator } from "../../../src/modules/distribution/core/exponential/validator";

describe("distribution.exponential", () => {
  describe("algorithm", () => {
    it("source = 0.5, rate = 1. should return exactly -ln(0.5)", () => {
      const algorithm = new ExponentialAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ rate: 1 })).toBeCloseTo(-Math.log(0.5), 12);
    });

    it("source = 0.5, rate = 2. should return exactly -ln(0.5) / 2", () => {
      const algorithm = new ExponentialAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ rate: 2 })).toBeCloseTo(
        -Math.log(0.5) / 2,
        12,
      );
    });

    it("source = 0, rate = 1. should return exactly 0", () => {
      const algorithm = new ExponentialAlgorithm({ next: () => 0 });

      // -Math.log(1 - 0) is -0, which is numerically 0 but fails a strict
      // Object.is comparison against +0.
      expect(algorithm.execute({ rate: 1 })).toBeCloseTo(0, 12);
    });
  });

  describe("validator", () => {
    it("rate = 0. should throw a ChacaError with the exact message", () => {
      const validator = new ExponentialValidator();

      expect(() => validator.execute({ rate: 0 })).toThrow(ChacaError);
      expect(() => validator.execute({ rate: 0 })).toThrow(
        "rate must be greater than 0.",
      );
    });

    it("rate = -1. should throw a ChacaError", () => {
      const validator = new ExponentialValidator();

      expect(() => validator.execute({ rate: -1 })).toThrow(ChacaError);
    });

    it("rate = 1. should not throw", () => {
      const validator = new ExponentialValidator();

      expect(() => validator.execute({ rate: 1 })).not.toThrow();
    });
  });
});
