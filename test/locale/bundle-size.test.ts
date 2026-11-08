import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * E2E-7: `es` is a separate `tsup` entry (`locale/es`), so it must not leak
 * into the browser bundle a consumer gets by importing the package's main
 * entry point without registering any locale. 20 sentinel strings, picked
 * from `src/locales/es/*.json` for being exclusive to `es` (an accented
 * vowel or an `ñ`, so they can't collide with `en` or with the rest of the
 * codebase) and verified absent from the built bundle before writing this
 * test.
 */
const SPANISH_SENTINELS = [
  "acompañar",
  "arañar",
  "añadir",
  "bañar",
  "dañar",
  "desempeñar",
  "diseñar",
  "engañar",
  "enseñar",
  "oír",
  "¡adiós!",
  "¡chévere!",
  "¡fantástico!",
  "¡ojalá!",
  "¡olé!",
  "¡órale!",
  "después",
  "comúnmente",
  "difícilmente",
  "débilmente",
];

describe("browser bundle without a registered locale has no Spanish data (E2E-7)", () => {
  it("dist/browser/index.mjs contains none of the 20 Spanish-exclusive sentinel strings", () => {
    const bundle = readFileSync(
      resolve(__dirname, "../../dist/browser/index.mjs"),
      "utf8",
    );

    for (const sentinel of SPANISH_SENTINELS) {
      expect(bundle).not.toContain(sentinel);
    }
  });
});
