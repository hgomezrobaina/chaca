import { RandomSource } from "../random-source";
import { logFactorial } from "../math/log-factorial";

interface Props {
  lambda: number;
}

/**
 * PTRD — Poisson Transformed Rejection with Squeeze: Hörmann (1993), "The
 * transformed rejection method for generating Poisson random variables",
 * https://statmath.wu.ac.at/papers/92-04-13.wh.abs.html. It is what Boost uses
 * above its own threshold (`boost/random/poisson_distribution.hpp`): constant
 * cost per sample, unlike inversion's `O(lambda)`.
 *
 * It samples from a scaled logistic envelope around `lambda` and either
 * accepts on a cheap squeeze (most draws) or falls back to the exact Poisson
 * log-probability (`-lambda + k*ln(lambda) - ln(k!)`).
 */
export class PoissonPtrdAlgorithm {
  constructor(private readonly source: RandomSource) {}

  execute({ lambda }: Props): number {
    const sqrtLambda = Math.sqrt(lambda);
    const logLambda = Math.log(lambda);

    const b = 0.931 + 2.53 * sqrtLambda;
    const a = -0.059 + 0.02483 * b;
    const invAlpha = 1.1239 + 1.1328 / (b - 3.4);
    const squeezeAcceptRadius = 0.9277 - 3.6224 / (b - 2);

    for (;;) {
      const u = this.source.next() - 0.5;
      const v = this.source.next();
      const us = 0.5 - Math.abs(u);
      const candidate = Math.floor(((2 * a) / us + b) * u + lambda + 0.43);

      if (us >= 0.07 && v <= squeezeAcceptRadius) {
        return candidate;
      }

      if (candidate < 0 || (us < 0.013 && v > us)) {
        continue;
      }

      const logAcceptRatio =
        Math.log(v) + Math.log(invAlpha) - Math.log(a / (us * us) + b);
      const logPoissonProbability =
        -lambda + candidate * logLambda - logFactorial(candidate);

      if (logAcceptRatio <= logPoissonProbability) {
        return candidate;
      }
    }
  }
}
