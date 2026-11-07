import { ChacaError } from "../../../../errors";

interface Props {
  lambda: number;
}

export class PoissonValidator {
  execute({ lambda }: Props): void {
    if (lambda <= 0) {
      throw new ChacaError(`lambda must be greater than 0.`);
    }
  }
}
