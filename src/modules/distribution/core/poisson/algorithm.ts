import { RandomSource } from "../random-source";
import { PoissonInversionAlgorithm } from "./inversion-algorithm";
import { PoissonPtrdAlgorithm } from "./ptrd-algorithm";

interface Props {
  lambda: number;
}

/**
 * This exact threshold is a tuning decision, not a mathematical constant:
 * Boost uses the same split (inversion below, PTRD above), but libraries
 * disagree on the exact value. The statistical tests validate it, not the
 * other way around.
 */
export const POISSON_PTRD_THRESHOLD = 30;

export class PoissonAlgorithm {
  private readonly inversionAlgorithm: PoissonInversionAlgorithm;
  private readonly ptrdAlgorithm: PoissonPtrdAlgorithm;

  constructor(source: RandomSource) {
    this.inversionAlgorithm = new PoissonInversionAlgorithm(source);
    this.ptrdAlgorithm = new PoissonPtrdAlgorithm(source);
  }

  execute({ lambda }: Props): number {
    if (lambda < POISSON_PTRD_THRESHOLD) {
      return this.inversionAlgorithm.execute({ lambda });
    }

    return this.ptrdAlgorithm.execute({ lambda });
  }
}
