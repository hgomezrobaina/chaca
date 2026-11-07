import { RandomSource } from "../random-source";

interface Props {
  mean: number;
  standardDeviation: number;
}

export class NormalAlgorithm {
  constructor(private readonly source: RandomSource) {}

  /**
   * Marsaglia polar method: rejection sampling over the unit circle, avoiding
   * `sin`/`cos` (faster and numerically more robust than Box-Muller).
   *
   * Each accepted point `(x, y)` yields two independent standard normal
   * values, `x * multiplier` and `y * multiplier`. This implementation keeps
   * only the first and discards the second on purpose: caching it would halve
   * the number of `source.next()` calls, but it would also make two
   * consecutive results depend on each other instead of each call being
   * independent — hidden state that complicates both exact tests and a
   * future seed.
   */
  execute({ mean, standardDeviation }: Props): number {
    let x: number;
    let y: number;
    let s: number;

    do {
      x = 2 * this.source.next() - 1;
      y = 2 * this.source.next() - 1;
      s = x * x + y * y;
    } while (s >= 1 || s === 0);

    const multiplier = Math.sqrt((-2 * Math.log(s)) / s);

    return mean + standardDeviation * x * multiplier;
  }
}
