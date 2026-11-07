import { ChacaError } from "../../../../errors";

interface Props {
  min: number;
  max: number;
}

export class UniformValidator {
  execute({ min, max }: Props): void {
    if (min > max) {
      throw new ChacaError(`Max ${max} should be greater than min ${min}.`);
    }
  }
}
