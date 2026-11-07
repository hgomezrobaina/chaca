import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { POISSON_PTRD_THRESHOLD } from "../../../../src/modules/distribution/core/poisson/algorithm";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.poisson (statistical)", () => {
  const cases = [
    { label: "inversion branch", lambda: POISSON_PTRD_THRESHOLD - 20 },
    { label: "PTRD branch", lambda: POISSON_PTRD_THRESHOLD + 20 },
  ];

  for (const { label, lambda } of cases) {
    it(`${label} (lambda = ${lambda}). mean, variance and support match theory`, () => {
      const n = 50000;

      const samples = Array.from({ length: n }, () =>
        modules.distribution.poisson({ lambda }),
      );

      // Poisson's mean and variance both equal lambda; its excess kurtosis is 1/lambda.
      const expectedMean = lambda;
      const expectedVariance = lambda;
      const excessKurtosis = 1 / lambda;

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
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  }
});
