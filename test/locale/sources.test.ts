import { describe, expect, it } from "vitest";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";
import { LocaleDefinition } from "../../src/core/locale/locale";

/**
 * Licenses that are share-alike over the data itself (as opposed to the
 * code that reads it) are incompatible with Chaca's MIT license and must
 * never be cited as a locale's source (requirements.md regla 3).
 */
const SHARE_ALIKE_LICENSES = ["CC-BY-SA", "CC BY-SA", "GPL", "LGPL", "MPL"];

const LOCALES: { name: string; locale: LocaleDefinition }[] = [
  { name: "en", locale: en },
  { name: "es", locale: es },
];

describe("every locale declares its sources (E2E-11)", () => {
  it.each(LOCALES)("$name has at least one source", ({ locale }) => {
    expect(locale.sources.length).toBeGreaterThan(0);
  });

  it.each(LOCALES)(
    "$name's sources each declare name, url, license and date",
    ({ locale }) => {
      for (const source of locale.sources) {
        expect(source.name.length).toBeGreaterThan(0);
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.license.length).toBeGreaterThan(0);
        expect(source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    },
  );

  it.each(LOCALES)(
    "$name cites no share-alike license over its data",
    ({ locale }) => {
      for (const source of locale.sources) {
        const isShareAlike = SHARE_ALIKE_LICENSES.some((license) => {
          return source.license.toUpperCase().includes(license.toUpperCase());
        });

        expect(isShareAlike).toBe(false);
      }
    },
  );
});
