import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.binomial (statistical)", () => {
  const cases = [
    { label: "BINV branch", trials: 19, probability: 0.5 },
    { label: "BTPE branch", trials: 100, probability: 0.3 },
  ];

  for (const { label, trials, probability } of cases) {
    it(`${label} (trials = ${trials}, probability = ${probability}). mean, variance and support match theory`, () => {
      const n = 50000;

      const samples = Array.from({ length: n }, () =>
        modules.distribution.binomial({ trials, probability }),
      );

      const q = 1 - probability;
      const expectedMean = trials * probability;
      const expectedVariance = trials * probability * q;
      // Excess kurtosis of a binomial: (1 - 6·p·q) / (trials·p·q).
      const excessKurtosis =
        (1 - 6 * probability * q) / (trials * probability * q);

      const result = SampleStatistics.execute(samples);
      const se = StandardErrors.execute({
        variance: expectedVariance,
        excessKurtosis,
        n,
      });

      expect(result.mean).toBeGreaterThan(
        expectedMean - CONFIDENCE_SIGMA * se.mean,
      );
      expect(result.mean).toBeLessThan(
        expectedMean + CONFIDENCE_SIGMA * se.mean,
      );
      expect(result.variance).toBeGreaterThan(
        expectedVariance - CONFIDENCE_SIGMA * se.variance,
      );
      expect(result.variance).toBeLessThan(
        expectedVariance + CONFIDENCE_SIGMA * se.variance,
      );

      for (const value of samples) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(trials);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  }
});
