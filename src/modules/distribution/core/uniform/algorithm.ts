import { RandomSource } from "../random-source";

interface Props {
  min: number;
  max: number;
}

export class UniformAlgorithm {
  constructor(private readonly source: RandomSource) {}

  execute({ min, max }: Props): number {
    return min + (max - min) * this.source.next();
  }
}
