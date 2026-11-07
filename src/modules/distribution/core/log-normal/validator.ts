import { NormalValidator } from "../normal/validator";

interface Props {
  standardDeviation: number;
}

/**
 * `logNormal`'s only constraint is on its underlying normal's standard
 * deviation, so this delegates to `NormalValidator` instead of repeating the
 * same check.
 */
export class LogNormalValidator {
  execute({ standardDeviation }: Props): void {
    const normalValidator = new NormalValidator();

    normalValidator.execute({ standardDeviation });
  }
}
