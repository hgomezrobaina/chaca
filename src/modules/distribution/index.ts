import { ChacaUtils } from "../../core/utils";
import { UniformValidator } from "./core/uniform/validator";
import { UniformAlgorithm } from "./core/uniform/algorithm";
import { NormalValidator } from "./core/normal/validator";
import { NormalAlgorithm } from "./core/normal/algorithm";
import { LogNormalValidator } from "./core/log-normal/validator";
import { LogNormalAlgorithm } from "./core/log-normal/algorithm";
import { ExponentialValidator } from "./core/exponential/validator";
import { ExponentialAlgorithm } from "./core/exponential/algorithm";
import { ParetoValidator } from "./core/pareto/validator";
import { ParetoAlgorithm } from "./core/pareto/algorithm";
import { PoissonValidator } from "./core/poisson/validator";
import { PoissonAlgorithm } from "./core/poisson/algorithm";
import { GeometricValidator } from "./core/geometric/validator";
import { GeometricAlgorithm } from "./core/geometric/algorithm";
import { BinomialValidator } from "./core/binomial/validator";
import { BinomialAlgorithm } from "./core/binomial/algorithm";

export type UniformProps = {
  min?: number;
  max?: number;
};

export type NormalProps = {
  mean?: number;
  standardDeviation?: number;
};

export type LogNormalProps = {
  mean?: number;
  standardDeviation?: number;
};

export type ExponentialProps = {
  rate?: number;
};

export type ParetoProps = {
  scale?: number;
  shape?: number;
};

export type PoissonProps = {
  lambda?: number;
};

export type GeometricProps = {
  probability?: number;
};

export type BinomialProps = {
  trials?: number;
  probability?: number;
};

export class DistributionModule {
  constructor(private readonly utils: ChacaUtils) {}

  /**
   * Returns a number from a continuous uniform distribution.
   *
   * @param args.min Lower bound, inclusive. Defaults to `0`
   * @param args.max Upper bound, exclusive. Defaults to `1`
   *
   * @example
   * modules.distribution.uniform() // 0.6137
   * modules.distribution.uniform({ min: 10, max: 20 }) // 14.283
   *
   * @returns number
   */
  uniform({ min = 0, max = 1 }: UniformProps = {}): number {
    const validator = new UniformValidator();
    validator.execute({ min, max });

    const algorithm = new UniformAlgorithm(this.utils);

    return algorithm.execute({ min, max });
  }

  /**
   * Returns a number from a normal (Gaussian) distribution.
   *
   * @param args.mean Mean of the distribution. Defaults to `0`
   * @param args.standardDeviation Standard deviation of the distribution. Must be greater than `0`. Defaults to `1`
   *
   * @example
   * modules.distribution.normal() // -0.3451
   * modules.distribution.normal({ mean: 35, standardDeviation: 8 }) // 38.912
   *
   * @returns number
   */
  normal({ mean = 0, standardDeviation = 1 }: NormalProps = {}): number {
    const validator = new NormalValidator();
    validator.execute({ standardDeviation });

    const algorithm = new NormalAlgorithm(this.utils);

    return algorithm.execute({ mean, standardDeviation });
  }

  /**
   * Returns a number from a log-normal distribution: `exp(X)`, where `X` is
   * normal. `mean` and `standardDeviation` are the parameters of that
   * underlying normal distribution of `ln(result)`, not of the result itself.
   *
   * @param args.mean Mean of the underlying normal distribution of the logarithm. Defaults to `0`
   * @param args.standardDeviation Standard deviation of the underlying normal distribution of the logarithm. Must be greater than `0`. Defaults to `1`
   *
   * @example
   * modules.distribution.logNormal() // 1.284
   * modules.distribution.logNormal({ mean: 8, standardDeviation: 0.5 }) // 3156.42
   *
   * @returns number
   */
  logNormal({ mean = 0, standardDeviation = 1 }: LogNormalProps = {}): number {
    const validator = new LogNormalValidator();
    validator.execute({ standardDeviation });

    const algorithm = new LogNormalAlgorithm(this.utils);

    return algorithm.execute({ mean, standardDeviation });
  }

  /**
   * Returns a number from an exponential distribution.
   *
   * @param args.rate Rate parameter (`λ`). Must be greater than `0`. Defaults to `1`
   *
   * @example
   * modules.distribution.exponential() // 0.891
   * modules.distribution.exponential({ rate: 0.5 }) // 4.207
   *
   * @returns number
   */
  exponential({ rate = 1 }: ExponentialProps = {}): number {
    const validator = new ExponentialValidator();
    validator.execute({ rate });

    const algorithm = new ExponentialAlgorithm(this.utils);

    return algorithm.execute({ rate });
  }

  /**
   * Returns a number from a Pareto distribution.
   *
   * @param args.scale Minimum possible value (`xm`). Must be greater than `0`. Defaults to `1`
   * @param args.shape Shape parameter (`α`). Must be greater than `0`. Defaults to `1`
   *
   * @example
   * modules.distribution.pareto() // 1.924
   * modules.distribution.pareto({ scale: 1000, shape: 2.5 }) // 1284.17
   *
   * @returns number
   */
  pareto({ scale = 1, shape = 1 }: ParetoProps = {}): number {
    const validator = new ParetoValidator();
    validator.execute({ scale, shape });

    const algorithm = new ParetoAlgorithm(this.utils);

    return algorithm.execute({ scale, shape });
  }

  /**
   * Returns an integer from a Poisson distribution: the number of events in a
   * fixed interval, given their average rate.
   *
   * @param args.lambda Average number of events (`λ`). Must be greater than `0`. Defaults to `1`
   *
   * @example
   * modules.distribution.poisson() // 1
   * modules.distribution.poisson({ lambda: 4 }) // 5
   *
   * @returns number
   */
  poisson({ lambda = 1 }: PoissonProps = {}): number {
    const validator = new PoissonValidator();
    validator.execute({ lambda });

    const algorithm = new PoissonAlgorithm(this.utils);

    return algorithm.execute({ lambda });
  }

  /**
   * Returns an integer from a geometric distribution: the number of trials up
   * to and including the first success, so the result is always `1` or
   * greater.
   *
   * @param args.probability Success probability of each trial. Must be greater than `0` and at most `1`. Defaults to `0.5`
   *
   * @example
   * modules.distribution.geometric() // 2
   * modules.distribution.geometric({ probability: 0.1 }) // 14
   *
   * @returns number
   */
  geometric({ probability = 0.5 }: GeometricProps = {}): number {
    const validator = new GeometricValidator();
    validator.execute({ probability });

    const algorithm = new GeometricAlgorithm(this.utils);

    return algorithm.execute({ probability });
  }

  /**
   * Returns an integer from a binomial distribution: the number of successes
   * in a fixed number of independent trials.
   *
   * @param args.trials Number of trials. Must be a non-negative integer. Defaults to `1`
   * @param args.probability Success probability of each trial. Must be between `0` and `1`. Defaults to `0.5`
   *
   * @example
   * modules.distribution.binomial() // 1
   * modules.distribution.binomial({ trials: 20, probability: 0.3 }) // 7
   *
   * @returns number
   */
  binomial({ trials = 1, probability = 0.5 }: BinomialProps = {}): number {
    const validator = new BinomialValidator();
    validator.execute({ trials, probability });

    const algorithm = new BinomialAlgorithm(this.utils);

    return algorithm.execute({ trials, probability });
  }
}
