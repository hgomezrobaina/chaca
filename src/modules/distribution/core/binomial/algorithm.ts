import { RandomSource } from "../random-source";
import { BinomialBinvAlgorithm } from "./binv-algorithm";
import { BinomialBtpeAlgorithm } from "./btpe-algorithm";

interface Props {
  trials: number;
  probability: number;
}

/**
 * This exact threshold is a tuning decision, not a mathematical constant:
 * the original paper uses 10, GSL uses 14, Ranlib uses 30. The statistical
 * tests validate it, not the other way around.
 */
export const BINOMIAL_BTPE_THRESHOLD = 10;

export class BinomialAlgorithm {
  private readonly binvAlgorithm: BinomialBinvAlgorithm;
  private readonly btpeAlgorithm: BinomialBtpeAlgorithm;

  constructor(source: RandomSource) {
    this.binvAlgorithm = new BinomialBinvAlgorithm(source);
    this.btpeAlgorithm = new BinomialBtpeAlgorithm(source);
  }

  execute({ trials, probability }: Props): number {
    const minProbability = Math.min(probability, 1 - probability);

    if (trials * minProbability < BINOMIAL_BTPE_THRESHOLD) {
      return this.binvAlgorithm.execute({ trials, probability });
    }

    return this.btpeAlgorithm.execute({ trials, probability });
  }
}
