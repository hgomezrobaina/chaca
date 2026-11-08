import { beforeAll, describe, expect, it } from "vitest";
import { Language, modules } from "../../../src";
import { es } from "../../../src/locales/es";

const cases = [
  ["adjective", "adjectives"],
  ["conjunction", "conjunctions"],
  ["interjection", "interjections"],
  ["preposition", "prepositions"],
  ["adverb", "adverbs"],
  ["verb", "verbs"],
  ["noun", "nouns"],
] as const;

describe("word modules", () => {
  beforeAll(() => {
    modules.registerLocale(es);
  });

  it.each(cases)("word.%s. default language is 'en'", (method, category) => {
    expect(modules.word.constants.words.en[category]).include(
      modules.word[method](),
    );
  });

  it.each(cases)("word.%s. language: 'es'", (method, category) => {
    expect(modules.word.constants.words.es[category]).include(
      modules.word[method]({ language: Language.Spanish }),
    );
  });

  it("word.conjuction. deprecated alias still returns a conjunction", () => {
    expect(modules.word.constants.words.en.conjunctions).include(
      modules.word.conjuction(),
    );
  });
});
