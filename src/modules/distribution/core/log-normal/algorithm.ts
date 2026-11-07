import { RandomSource } from "../random-source";
import { NormalAlgorithm } from "../normal/algorithm";

interface Props {
  mean: number;
  standardDeviation: number;
}

export class LogNormalAlgorithm {
  constructor(private readonly source: RandomSource) {}

  /**
   * By definition: `exp(normal(mean, standardDeviation))`, where `mean` and
   * `standardDeviation` are the parameters of the underlying normal
   * distribution of `ln(X)`, not of `X` itself.
   */
  execute({ mean, standardDeviation }: Props): number {
    const normalAlgorithm = new NormalAlgorithm(this.source);

    return Math.exp(normalAlgorithm.execute({ mean, standardDeviation }));
  }
}
