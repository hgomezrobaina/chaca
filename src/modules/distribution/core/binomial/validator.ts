import { ChacaError } from "../../../../errors";

interface Props {
  trials: number;
  probability: number;
}

export class BinomialValidator {
  execute({ trials, probability }: Props): void {
    if (trials < 0 || !Number.isInteger(trials)) {
      throw new ChacaError(`trials must be a non-negative integer.`);
    }

    if (!(probability >= 0 && probability <= 1)) {
      throw new ChacaError(`probability must be between 0 and 1.`);
    }
  }
}
