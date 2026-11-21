import { beforeAll, describe, expect, it } from "vitest";
import { ChacaModules, ChacaUtils, Language } from "../../../src";
import { en } from "../../../src/locales/en";
import { LocaleDefinition } from "../../../src/core/locale/locale";

/**
 * A locale built from `en`, overriding only `lorem.words`. The real `es`
 * locale's vocabulary isn't written yet (docs/specs/locale-completeness §5),
 * so this is what lets `lorem`'s wiring to the resolver be verified now,
 * independently of when that data lands.
 */
const TEST_WORDS = ["uno", "dos", "tres", "cuatro", "cinco"];

const testLocale: LocaleDefinition = {
  ...en,
  code: Language.Spanish,
  lorem: { words: TEST_WORDS },
};

describe("lorem methods read the locale's vocabulary", () => {
  let modules: ChacaModules;

  beforeAll(() => {
    modules = new ChacaModules(new ChacaUtils());
    modules.registerLocale(testLocale);
  });

  function expectOnlyTestWords(text: string): void {
    const words = text
      .toLowerCase()
      .replace(/[.,-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);

    for (const word of words) {
      expect(TEST_WORDS).toContain(word);
    }
  }

  it("word", () => {
    expectOnlyTestWords(modules.lorem.word({ language: Language.Spanish }));
  });

  it("words", () => {
    expectOnlyTestWords(
      modules.lorem.words({ language: Language.Spanish, count: 8 }),
    );
  });

  it("sentence", () => {
    expectOnlyTestWords(modules.lorem.sentence({ language: Language.Spanish }));
  });

  it("sentences", () => {
    expectOnlyTestWords(
      modules.lorem.sentences({ language: Language.Spanish }),
    );
  });

  it("paragraph", () => {
    expectOnlyTestWords(
      modules.lorem.paragraph({ language: Language.Spanish }),
    );
  });

  it("paragraphs", () => {
    expectOnlyTestWords(
      modules.lorem.paragraphs({ language: Language.Spanish }),
    );
  });

  it("slug", () => {
    const slug = modules.lorem.slug({ language: Language.Spanish });

    expectOnlyTestWords(slug.replace(/-/g, " "));
  });

  it("without language, still draws from the default English vocabulary", () => {
    const word = modules.lorem.word();

    expect(TEST_WORDS).not.toContain(word);
  });
});
