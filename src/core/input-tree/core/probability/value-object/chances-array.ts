import { WrongProbabilityFieldDefinitionError } from "../../../../../errors";
import { DatasetStore } from "../../../../dataset-store/dataset-store";
import { ProbabilityOption } from "../../../../fields/core/probability/probability-field";
import { DocumentTree } from "../../../../result-tree/classes/document/document-tree";
import { ChacaUtils } from "../../../../utils";
import { Chance } from "./chance";
import { ChanceValue } from "./chance-value";

interface Props {
  options: ProbabilityOption[];
  route: string;
}

interface ValueProps {
  store: DatasetStore;
  currentDocument: DocumentTree;
}

interface Option {
  value: ChanceValue;
  chance: Chance;
}

export class ChancesArray {
  private readonly options: Option[] = [];
  private readonly route: string;

  constructor(
    private readonly utils: ChacaUtils,
    { options, route }: Props,
  ) {
    this.route = route;

    if (options.length > 0) {
      for (const option of options) {
        if (typeof option === "object" && option !== null) {
          const chance = Chance.create({ route: route, value: option.chance });

          const value = new ChanceValue(option.value);

          this.options.push({ chance: chance, value: value });
        } else {
          throw new WrongProbabilityFieldDefinitionError(
            route,
            `The 'chance' and 'value' parameters must be specified for each value in the array`,
          );
        }
      }
    } else {
      throw new WrongProbabilityFieldDefinitionError(
        route,
        `There are no values for the probability field'`,
      );
    }
  }

  async value({ currentDocument, store }: ValueProps): Promise<unknown> {
    const weights: number[] = [];

    for (const o of this.options) {
      const chance = await o.chance.value({
        currentDocument: currentDocument,
        store: store,
      });

      weights.push(chance);
    }

    const sum = weights.reduce((a, b) => a + b, 0);

    if (sum === 0) {
      throw new WrongProbabilityFieldDefinitionError(
        this.route,
        `At least one option of the probability field must have a chance greater than 0`,
      );
    }

    return this.pickByCumulativeWeight(weights, sum);
  }

  /**
   * Picks one option with probability exactly proportional to its weight:
   * draws a single point in `[0, sum)` and walks the cumulative weights
   * until it lands. No quantization, unlike the fixed-size "bucket"
   * approach this replaced, which gave any option with `chance > 0` at
   * least `1 / size` of the pool no matter how small its real weight was.
   */
  private pickByCumulativeWeight(weights: number[], sum: number): unknown {
    const target = this.utils.next() * sum;

    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];

      if (target < cumulative) {
        return this.options[i].value.value();
      }
    }

    // Floating-point rounding can leave `target` at or just past the last
    // cumulative sum; the last option is where it mathematically belongs.
    return this.options[weights.length - 1].value.value();
  }
}
