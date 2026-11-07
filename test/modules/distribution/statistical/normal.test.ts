import { describe, expect, it } from "vitest";
import { modules } from "../../../../src";
import { SampleStatistics } from "../../../shared/core/sample-statistics";
import { StandardErrors } from "./standard-errors";
import { CONFIDENCE_SIGMA } from "./confidence-sigma";

describe("distribution.normal (statistical)", () => {
  it("mean = 35, standardDeviation = 8. sample mean and variance match theory", () => {
    const mean = 35;
    const standardDeviation = 8;
    const n = 50000;

    const samples = Array.from({ length: n }, () =>
      modules.distribution.normal({ mean, standardDeviation }),
    );

    const expectedVariance = standardDeviation * standardDeviation;
    // Normal's excess kurtosis is 0 by definition.
    const excessKurtosis = 0;

    const result = SampleStatistics.execute(samples);
    const se = StandardErrors.execute({
      variance: expectedVariance,
      excessKurtosis,
      n,
    });

    expect(result.mean).toBeGreaterThan(mean - CONFIDENCE_SIGMA * se.mean);
    expect(result.mean).toBeLessThan(mean + CONFIDENCE_SIGMA * se.mean);
    expect(result.variance).toBeGreaterThan(
      expectedVariance - CONFIDENCE_SIGMA * se.variance,
    );
    expect(result.variance).toBeLessThan(
      expectedVariance + CONFIDENCE_SIGMA * se.variance,
    );
  });
});
