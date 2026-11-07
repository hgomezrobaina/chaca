import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.logNormal (statistical)", () => {
  it("mean = 0, standardDeviation = 0.4 (of the logarithm). mean, variance and support match theory", () => {
    const mean = 0;
    const standardDeviation = 0.4;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.logNormal({ mean, standardDeviation }),
    );

    const sigma2 = standardDeviation * standardDeviation;
    const expectedMean = Math.exp(mean + sigma2 / 2);
    const expectedVariance =
      (Math.exp(sigma2) - 1) * Math.exp(2 * mean + sigma2);
    // Excess kurtosis of a log-normal, in terms of its underlying normal's
    // variance (sigma2): exp(4·sigma2) + 2·exp(3·sigma2) + 3·exp(2·sigma2) - 6.
    const excessKurtosis =
      Math.exp(4 * sigma2) +
      2 * Math.exp(3 * sigma2) +
      3 * Math.exp(2 * sigma2) -
      6;

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
      expect(value).toBeGreaterThan(0);
    }
  });
});
