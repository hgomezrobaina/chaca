import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.geometric (statistical)", () => {
  it("probability = 0.3. mean, variance and support match theory", () => {
    const probability = 0.3;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.geometric({ probability }),
    );

    const expectedMean = 1 / probability;
    const expectedVariance = (1 - probability) / (probability * probability);
    // Excess kurtosis of a geometric (support {1, 2, ...}): 6 + p² / (1 - p).
    const excessKurtosis = 6 + (probability * probability) / (1 - probability);

    const result = SampleStatistics.execute(samples);
    const se = StandardErrors.execute({
      variance: expectedVariance,
      excessKurtosis,
      n,
    });

    expect(result.mean).toBeGreaterThan(
      expectedMean - CONFIDENCE_SIGMA * se.mean,
    );
    expect(result.mean).toBeLessThan(expectedMean + CONFIDENCE_SIGMA * se.mean);
    expect(result.variance).toBeGreaterThan(
      expectedVariance - CONFIDENCE_SIGMA * se.variance,
    );
    expect(result.variance).toBeLessThan(
      expectedVariance + CONFIDENCE_SIGMA * se.variance,
    );

    for (const value of samples) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
