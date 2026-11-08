import { beforeAll, describe, expect, it } from "vitest";
import { ChacaModules, ChacaUtils, Language } from "../../src";
import { es } from "../../src/locales/es";

describe("Spanish registered", () => {
  let modules: ChacaModules;

  beforeAll(() => {
    modules = new ChacaModules(new ChacaUtils());
    modules.registerLocale(es);
  });

  it("word methods return a Spanish word when asked for Language.Spanish", () => {
    const words = modules.word.constants.words.es;

    expect(words.nouns).include(
      modules.word.noun({ language: Language.Spanish }),
    );
    expect(words.verbs).include(
      modules.word.verb({ language: Language.Spanish }),
    );
    expect(words.adjectives).include(
      modules.word.adjective({ language: Language.Spanish }),
    );
    expect(words.adverbs).include(
      modules.word.adverb({ language: Language.Spanish }),
    );
    expect(words.prepositions).include(
      modules.word.preposition({ language: Language.Spanish }),
    );
    expect(words.conjunctions).include(
      modules.word.conjunction({ language: Language.Spanish }),
    );
    expect(words.interjections).include(
      modules.word.interjection({ language: Language.Spanish }),
    );
  });

  it("person name methods return a Spanish name when asked for Language.Spanish", () => {
    const names = modules.person.constants.names.es;

    expect([...names.female, ...names.male]).include(
      modules.person.firstName({ language: Language.Spanish }),
    );
    expect(names.lastNames).include(
      modules.person.lastName({ language: Language.Spanish }),
    );
  });
});
