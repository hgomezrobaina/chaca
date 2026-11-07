import { ChacaError } from "../../../../errors";

interface Props {
  probability: number;
}

export class GeometricValidator {
  execute({ probability }: Props): void {
    if (!(probability > 0 && probability <= 1)) {
      throw new ChacaError(
        `probability must be greater than 0 and less than or equal to 1.`,
      );
    }
  }
}
