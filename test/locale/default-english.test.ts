import { describe, expect, it } from "vitest";
import { ChacaModules, ChacaUtils } from "../../src";

/**
 * A fresh `ChacaModules`, with nothing registered beyond the built-in `en`.
 * Each test gets its own instance instead of the shared `modules` singleton,
 * so a locale another test registers can never leak here (E2E-1, E2E-14).
 */
function freshModules(): ChacaModules {
  return new ChacaModules(new ChacaUtils());
}

describe("default locale, nothing registered", () => {
  it("word methods return an English word, called with no arguments", () => {
    const modules = freshModules();

    expect(modules.word.constants.words.en.nouns).include(modules.word.noun());
    expect(modules.word.constants.words.en.verbs).include(modules.word.verb());
    expect(modules.word.constants.words.en.adjectives).include(
      modules.word.adjective(),
    );
    expect(modules.word.constants.words.en.adverbs).include(
      modules.word.adverb(),
    );
    expect(modules.word.constants.words.en.prepositions).include(
      modules.word.preposition(),
    );
    expect(modules.word.constants.words.en.conjunctions).include(
      modules.word.conjunction(),
    );
    expect(modules.word.constants.words.en.interjections).include(
      modules.word.interjection(),
    );
  });

  it("person name methods return an English name, called with no arguments", () => {
    const modules = freshModules();
    const names = modules.person.constants.names.en;

    expect([...names.female, ...names.male]).include(
      modules.person.firstName(),
    );
    expect(names.lastNames).include(modules.person.lastName());
  });
});
