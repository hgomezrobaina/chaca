import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.exponential (statistical)", () => {
  it("rate = 2. mean, variance and support match theory", () => {
    const rate = 2;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.exponential({ rate }),
    );

    const expectedMean = 1 / rate;
    const expectedVariance = 1 / (rate * rate);
    // Exponential's excess kurtosis is 6, regardless of rate.
    const excessKurtosis = 6;

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
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});
