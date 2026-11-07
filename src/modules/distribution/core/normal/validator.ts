import { ChacaError } from "../../../../errors";

interface Props {
  standardDeviation: number;
}

export class NormalValidator {
  execute({ standardDeviation }: Props): void {
    if (standardDeviation <= 0) {
      throw new ChacaError(`standardDeviation must be greater than 0.`);
    }
  }
}
