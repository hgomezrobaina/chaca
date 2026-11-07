import { RandomSource } from "../random-source";

interface Props {
  rate: number;
}

export class ExponentialAlgorithm {
  constructor(private readonly source: RandomSource) {}

  /**
   * Inverse transform sampling. Uses `1 - u` instead of `u` because `source.next()`
   * can return `0`, and `ln(0)` is `-Infinity`; `source.next()` never returns `1`,
   * so `1 - u` never reaches `0`.
   */
  execute({ rate }: Props): number {
    const u = this.source.next();

    return -Math.log(1 - u) / rate;
  }
}
