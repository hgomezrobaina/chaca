import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.pareto (statistical)", () => {
  it("scale = 3, shape = 6. mean, variance and support match theory", () => {
    const scale = 3;
    const shape = 6;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.pareto({ scale, shape }),
    );

    const expectedMean = (shape * scale) / (shape - 1);
    const expectedVariance =
      (scale * scale * shape) / ((shape - 1) ** 2 * (shape - 2));
    // Excess kurtosis of a Pareto Type I (finite only for shape > 4):
    // 6·(shape³ + shape² - 6·shape - 2) / (shape·(shape - 3)·(shape - 4)).
    const excessKurtosis =
      (6 * (shape ** 3 + shape ** 2 - 6 * shape - 2)) /
      (shape * (shape - 3) * (shape - 4));

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
      expect(value).toBeGreaterThanOrEqual(scale);
    }
  });
});
