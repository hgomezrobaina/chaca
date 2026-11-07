import { RandomSource } from "../random-source";

interface Props {
  trials: number;
  probability: number;
}

/**
 * Inversion by cumulative product, the same shape as `poisson`'s: walks the
 * binomial PMF term by term starting at `k = 0`
 * (`p(k+1) = p(k) * (trials - k) / (k + 1) * p / (1 - p)`), accumulating the
 * CDF until it passes `u`. Exact, but `O(trials * p)` steps, so it is only
 * used below `BINOMIAL_BTPE_THRESHOLD`.
 */
export class BinomialBinvAlgorithm {
  constructor(private readonly source: RandomSource) {}

  execute({ trials, probability }: Props): number {
    if (probability === 0) {
      return 0;
    }

    if (probability === 1) {
      return trials;
    }

    const u = this.source.next();
    const oddsRatio = probability / (1 - probability);

    let term = Math.pow(1 - probability, trials);
    let cumulativeProbability = term;
    let k = 0;

    while (u > cumulativeProbability && k < trials) {
      term *= (oddsRatio * (trials - k)) / (k + 1);
      cumulativeProbability += term;
      k += 1;
    }

    return k;
  }
}
