import { bench, describe } from "vitest";
import { DATASET_SCALES, relationalDataset } from "./shared/datasets";
import { chaca, keep, modules } from "./shared/lib";

describe("dataset · relacional", () => {
  for (const scale of DATASET_SCALES) {
    const dataset = relationalDataset({ chacaLib: { chaca, modules }, scale });
    const documents = 35 * scale;

    bench(`generate() ~${documents} docs`, async () => {
      keep(await dataset.generate());
    });
  }
});
