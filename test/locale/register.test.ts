import { describe, expect, it } from "vitest";
import { ChacaModules, ChacaUtils, Language } from "../../src";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";

describe("registerLocale", () => {
  it("registering the same code twice replaces it instead of duplicating it", () => {
    const modules = new ChacaModules(new ChacaUtils());

    modules.registerLocale(es);
    modules.registerLocale(es);

    const registered = Object.keys(modules.word.constants.words);
    const spanishEntries = registered.filter(
      (code) => code === Language.Spanish,
    );

    expect(spanishEntries).toHaveLength(1);
    expect(modules.word.constants.words.es.nouns).toEqual(es.word.nouns);
  });

  it("re-registering English replaces the default locale, including for calls with no language", () => {
    const modules = new ChacaModules(new ChacaUtils());
    const overriddenEnglish = {
      ...en,
      word: { ...en.word, nouns: ["onlyword"] },
    };

    modules.registerLocale(overriddenEnglish);

    expect(modules.word.noun()).toBe("onlyword");
    expect(modules.word.noun({ language: Language.English })).toBe("onlyword");
  });
});
