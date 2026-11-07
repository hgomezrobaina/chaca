import { ChacaError } from "../../../../errors";

interface Props {
  scale: number;
  shape: number;
}

export class ParetoValidator {
  execute({ scale, shape }: Props): void {
    if (scale <= 0) {
      throw new ChacaError(`scale must be greater than 0.`);
    }

    if (shape <= 0) {
      throw new ChacaError(`shape must be greater than 0.`);
    }
  }
}
