import { RandomSource } from "../random-source";

interface Props {
  scale: number;
  shape: number;
}

export class ParetoAlgorithm {
  constructor(private readonly source: RandomSource) {}

  /** Inverse transform sampling; `1 - u` for the same reason as `exponential`. */
  execute({ scale, shape }: Props): number {
    const u = this.source.next();

    return scale / Math.pow(1 - u, 1 / shape);
  }
}
