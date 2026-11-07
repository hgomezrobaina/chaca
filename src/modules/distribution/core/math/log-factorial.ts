const STIRLING_THRESHOLD = 15;
const HALF_LOG_TWO_PI = 0.5 * Math.log(2 * Math.PI);

/**
 * Returns `ln(n!)`, for `n` a non-negative integer.
 *
 * Below {@link STIRLING_THRESHOLD}, it is the exact sum of logs. Above it,
 * it is the standard Stirling asymptotic series (textbook expansion of
 * `ln(Γ(n + 1))`), accurate to double precision for any `n` this large.
 * `poisson`'s PTRD branch is the only caller, and only runs for `k` close to
 * `lambda >= 30`, so the exact branch below the threshold exists only for
 * completeness, not because PTRD reaches it in practice.
 */
export function logFactorial(n: number): number {
  if (n < STIRLING_THRESHOLD) {
    let sum = 0;

    for (let i = 2; i <= n; i++) {
      sum += Math.log(i);
    }

    return sum;
  }

  const invN = 1 / n;
  const invN2 = invN * invN;

  return (
    (n + 0.5) * Math.log(n) -
    n +
    HALF_LOG_TWO_PI +
    invN * (1 / 12 - invN2 * (1 / 360 - invN2 / 1260))
  );
}
