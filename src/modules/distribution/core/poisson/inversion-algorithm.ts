import { RandomSource } from "../random-source";

interface Props {
  lambda: number;
}

/**
 * Inversion by cumulative product: walks the Poisson PMF term by term
 * (`p(k+1) = p(k) * lambda / (k + 1)`), accumulating the CDF until it passes
 * `u`. Exact, but `O(lambda)` steps, so it is only used below
 * `POISSON_PTRD_THRESHOLD`.
 */
export class PoissonInversionAlgorithm {
  constructor(private readonly source: RandomSource) {}

  execute({ lambda }: Props): number {
    const u = this.source.next();
    const limit = Math.exp(-lambda);

    let cumulativeProbability = limit;
    let term = limit;
    let k = 0;

    while (u > cumulativeProbability) {
      k += 1;
      term *= lambda / k;
      cumulativeProbability += term;
    }

    return k;
  }
}
