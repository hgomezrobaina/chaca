import { ChacaError } from "../../../../errors";

interface Props {
  rate: number;
}

export class ExponentialValidator {
  execute({ rate }: Props): void {
    if (rate <= 0) {
      throw new ChacaError(`rate must be greater than 0.`);
    }
  }
}
