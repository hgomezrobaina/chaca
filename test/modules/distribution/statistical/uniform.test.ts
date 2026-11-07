import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.uniform (statistical)", () => {
  it("min = 10, max = 50. mean, variance and support match theory", () => {
    const min = 10;
    const max = 50;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.uniform({ min, max }),
    );

    const expectedMean = (min + max) / 2;
    const expectedVariance = (max - min) ** 2 / 12;
    // Continuous uniform's excess kurtosis is -6/5, a constant of the shape.
    const excessKurtosis = -6 / 5;

    const { mean, variance } = SampleStatistics.execute(samples);
    const se = StandardErrors.execute({
      variance: expectedVariance,
      excessKurtosis,
      n,
    });

    expect(mean).toBeGreaterThan(expectedMean - CONFIDENCE_SIGMA * se.mean);
    expect(mean).toBeLessThan(expectedMean + CONFIDENCE_SIGMA * se.mean);
    expect(variance).toBeGreaterThan(
      expectedVariance - CONFIDENCE_SIGMA * se.variance,
    );
    expect(variance).toBeLessThan(
      expectedVariance + CONFIDENCE_SIGMA * se.variance,
    );

    for (const value of samples) {
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
    }
  });
});
