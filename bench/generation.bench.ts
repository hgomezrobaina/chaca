import { bench, describe } from "vitest";
import { keep } from "./shared/lib";
import { COMPLEX_SCHEMA, SIMPLE_SCHEMA, SIZES } from "./shared/schemas";

describe("generation · schema simple", () => {
  for (const n of SIZES) {
    bench(`array(${n})`, async () => {
      keep(await SIMPLE_SCHEMA.array(n));
    });
  }
});

describe("generation · schema completo", () => {
  for (const n of SIZES) {
    bench(`array(${n})`, async () => {
      keep(await COMPLEX_SCHEMA.array(n));
    });
  }
});

describe("generation · un documento", () => {
  bench("object() simple", async () => {
    keep(await SIMPLE_SCHEMA.object());
  });

  bench("object() completo", async () => {
    keep(await COMPLEX_SCHEMA.object());
  });
});
