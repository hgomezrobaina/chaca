interface Props {
  variance: number;
  excessKurtosis: number;
  n: number;
}

interface Result {
  mean: number;
  variance: number;
}

/**
 * Standard errors of the sample mean and the sample variance, derived from
 * the distribution's own variance and excess kurtosis — not fixed "by eye".
 *
 * `SE(mean) = sqrt(variance / n)` holds for any distribution with finite
 * variance (CLT). `SE(variance) ≈ sqrt((excessKurtosis + 2) * variance² / n)`
 * is the standard large-sample delta-method approximation; it reduces to the
 * textbook `variance * sqrt(2 / n)` for a normal sample, where
 * `excessKurtosis = 0`.
 */
export class StandardErrors {
  static execute({ variance, excessKurtosis, n }: Props): Result {
    return {
      mean: Math.sqrt(variance / n),
      variance: Math.sqrt(((excessKurtosis + 2) * variance * variance) / n),
    };
  }
}
