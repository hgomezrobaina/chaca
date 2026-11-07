import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import {
  BinomialAlgorithm,
  BINOMIAL_BTPE_THRESHOLD,
} from "../../../src/modules/distribution/core/binomial/algorithm";
import { BinomialBinvAlgorithm } from "../../../src/modules/distribution/core/binomial/binv-algorithm";
import { BinomialBtpeAlgorithm } from "../../../src/modules/distribution/core/binomial/btpe-algorithm";
import { BinomialValidator } from "../../../src/modules/distribution/core/binomial/validator";

describe("distribution.binomial", () => {
  describe("BINV algorithm", () => {
    it("source = 0.5, trials = 4, probability = 0.3. should return exactly 1", () => {
      const algorithm = new BinomialBinvAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ trials: 4, probability: 0.3 })).toBe(1);
    });

    it("probability = 0. should always return 0", () => {
      const algorithm = new BinomialBinvAlgorithm({ next: () => 0.9999 });

      expect(algorithm.execute({ trials: 10, probability: 0 })).toBe(0);
    });

    it("probability = 1. should always return trials", () => {
      const algorithm = new BinomialBinvAlgorithm({ next: () => 0.0001 });

      expect(algorithm.execute({ trials: 10, probability: 1 })).toBe(10);
    });
  });

  describe("branch dispatch", () => {
    it("trials * min(p, 1-p) below the threshold. delegates to BINV", () => {
      // 19 * 0.5 = 9.5 < 10.
      const trials = 19;
      const probability = 0.5;

      const orchestrator = new BinomialAlgorithm({ next: () => 0.5 });
      const binv = new BinomialBinvAlgorithm({ next: () => 0.5 });

      expect(orchestrator.execute({ trials, probability })).toBe(
        binv.execute({ trials, probability }),
      );
    });

    it("trials * min(p, 1-p) at the threshold. delegates to BTPE", () => {
      // 20 * 0.5 = 10 = BINOMIAL_BTPE_THRESHOLD.
      const trials = BINOMIAL_BTPE_THRESHOLD * 2;
      const probability = 0.5;

      // BTPE is rejection sampling: a short repeating sequence can cycle
      // through only rejecting draws and never terminate. A long
      // non-repeating sequence, captured once, avoids that.
      const values = Array.from({ length: 500 }, () => Math.random());
      const makeSource = () => {
        let i = 0;
        return { next: () => values[i++] };
      };

      const orchestrator = new BinomialAlgorithm(makeSource());
      const btpe = new BinomialBtpeAlgorithm(makeSource());

      expect(orchestrator.execute({ trials, probability })).toBe(
        btpe.execute({ trials, probability }),
      );
    });
  });

  describe("validator", () => {
    it("trials = -1. should throw a ChacaError with the exact message", () => {
      const validator = new BinomialValidator();

      expect(() => validator.execute({ trials: -1, probability: 0.5 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ trials: -1, probability: 0.5 })).toThrow(
        "trials must be a non-negative integer.",
      );
    });

    it("trials = 2.5. should throw a ChacaError with the exact message", () => {
      const validator = new BinomialValidator();

      expect(() =>
        validator.execute({ trials: 2.5, probability: 0.5 }),
      ).toThrow("trials must be a non-negative integer.");
    });

    it("probability = 1.5. should throw a ChacaError with the exact message", () => {
      const validator = new BinomialValidator();

      expect(() => validator.execute({ trials: 10, probability: 1.5 })).toThrow(
        ChacaError,
      );
      expect(() => validator.execute({ trials: 10, probability: 1.5 })).toThrow(
        "probability must be between 0 and 1.",
      );
    });

    it("trials = 10, probability = 0.5. should not throw", () => {
      const validator = new BinomialValidator();

      expect(() =>
        validator.execute({ trials: 10, probability: 0.5 }),
      ).not.toThrow();
    });
  });
});
