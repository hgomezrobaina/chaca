import { readFileSync } from "fs";
import { resolve } from "path";
import { exec } from "shelljs";
import { describe, expect, it } from "vitest";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";

interface LocaleRow {
  petType: string;
  birthMonth: string;
  accountType: string;
  favoriteVerb: string;
}

/**
 * E2E-17: the CLI's `--config` file is plain Node code running against
 * `dist/`, so it can register a locale the same way any consumer would
 * (`test/cli/locale/locale.js` requires `chaca/locale/es` through the
 * package's self-reference and calls `modules.registerLocale`). Checks the
 * four categories with zero overlap with `en` (see
 * `test/example-case/spanish-dataset.test.ts` for why the others can't be
 * checked this way without being flaky).
 */
describe("CLI with a registered locale (E2E-17)", () => {
  it("json --config registering es. exits 0 and the file contains only Spanish values", () => {
    const result = exec(
      "node ./dist/bin/chaca.js json --count 20 --filename locale-test --output data/cli/locale --config test/cli/locale/locale.js",
    );

    expect(result.code).toBe(0);

    const content: { "locale-test": LocaleRow[] } = JSON.parse(
      readFileSync(
        resolve(__dirname, "../../data/cli/locale/locale-test.json"),
        "utf8",
      ),
    );
    const rows = content["locale-test"];

    expect(rows).toHaveLength(20);

    for (const row of rows) {
      expect(es.animal.types).toContain(row.petType);
      expect(en.animal.types).not.toContain(row.petType);

      expect(es.date.months).toContain(row.birthMonth);
      expect(en.date.months).not.toContain(row.birthMonth);

      expect(es.finance.accountTypes).toContain(row.accountType);
      expect(en.finance.accountTypes).not.toContain(row.accountType);

      expect(es.word.verbs).toContain(row.favoriteVerb);
      expect(en.word.verbs).not.toContain(row.favoriteVerb);
    }
  });
});
