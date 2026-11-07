import { RandomSource } from "../random-source";

interface Props {
  probability: number;
}

export class GeometricAlgorithm {
  constructor(private readonly source: RandomSource) {}

  /**
   * Inverse transform sampling. Counts trials up to and including the first
   * success, so the support is `{1, 2, 3, ...}`.
   *
   * `probability === 1` is handled directly: the first trial always succeeds,
   * and the general formula would divide by `ln(0) = -Infinity`.
   *
   * `Math.max(1, ...)` guards the other edge: `source.next()` can return
   * exactly `0`, and at `u = 0` the formula evaluates to `0` (the smallest
   * integer whose CDF reaches `0`), one below the support's minimum of `1`.
   * For every `u > 0`, however small, the formula is already `>= 1`.
   */
  execute({ probability }: Props): number {
    if (probability === 1) {
      return 1;
    }

    const u = this.source.next();

    return Math.max(1, Math.ceil(Math.log(1 - u) / Math.log(1 - probability)));
  }
}
