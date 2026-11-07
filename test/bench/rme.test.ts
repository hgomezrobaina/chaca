import { describe, expect, it } from "vitest";
import { relativeMarginOfError } from "../../bench/competitors/rme";

describe("relativeMarginOfError", () => {
  it("[1, 1, 1, 1, 1]. no variance should give a margin of 0", () => {
    expect(relativeMarginOfError([1, 1, 1, 1, 1])).toBe(0);
  });

  it("[8, 9, 10, 11, 12]. known sample should match the expected margin", () => {
    // media 10, desviación muestral sqrt(2.5) ≈ 1.5811, error estándar ≈ 0.7071
    // rme = 1.96 * 0.7071 / 10 * 100 ≈ 13.859 %
    const samples = [8, 9, 10, 11, 12];

    expect(relativeMarginOfError(samples)).toBeCloseTo(13.859, 2);
  });

  it("[42]. a single sample should not produce NaN", () => {
    expect(relativeMarginOfError([42])).toBe(0);
  });

  it("[]. an empty sample should not produce NaN", () => {
    expect(relativeMarginOfError([])).toBe(0);
  });

  it("[0, 0, 0]. a mean of zero should not produce NaN or Infinity", () => {
    expect(relativeMarginOfError([0, 0, 0])).toBe(0);
  });
});
