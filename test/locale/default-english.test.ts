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

  it("person's other methods return an English value, called with no arguments", () => {
    const modules = freshModules();
    const constants = modules.person.constants;

    expect(constants.genders.en).include(modules.person.gender());
    expect(constants.jobAreas.en).include(modules.person.jobArea());
    expect(constants.jobLevels.en).include(modules.person.jobLevel());
    expect(constants.languages.en).include(modules.person.language());
    expect(constants.sexs.en).include(modules.person.sex());
    expect(constants.zodiacSigns.en).include(modules.person.zodiacSign());
    expect([
      ...constants.prefixes.en.male,
      ...constants.prefixes.en.female,
    ]).include(modules.person.prefix());
  });

  it("date methods return an English value, called with no arguments", () => {
    const modules = freshModules();

    expect(modules.date.constants.months.en).include(modules.date.month());
    expect(modules.date.constants.weekDays.en).include(modules.date.weekDay());
    expect(modules.date.timeAgo()).toMatch(
      /^\d+ (years|seconds|minutes|days|hours|months) ago$/,
    );
  });

  it("address methods return an English value, called with no arguments", () => {
    const modules = freshModules();
    const constants = modules.address.constants;

    expect(constants.countries.en.map((c) => c.country)).include(
      modules.address.country(),
    );
    expect(constants.cardinalDirections.en).include(
      modules.address.cardinalDirection(),
    );
    expect(constants.ordinalDirection.en).include(
      modules.address.ordinalDirection(),
    );
  });

  it("color.human returns an English value, called with no arguments", () => {
    const modules = freshModules();

    expect(modules.color.constants.human.en).include(modules.color.human());
  });

  it("finance methods return an English value, called with no arguments", () => {
    const modules = freshModules();
    const constants = modules.finance.constants;

    expect(constants.accountTypes.en).include(modules.finance.accountType());
    expect(constants.subscriptionPlans.en).include(
      modules.finance.subscriptionPlan(),
    );
    expect(constants.transactionTypes.en).include(
      modules.finance.transaction(),
    );
    expect(Object.values(constants.currencyNames.en)).include(
      modules.finance.currencyMoneyName(),
    );
  });

  it("science methods return an English value, called with no arguments", () => {
    const modules = freshModules();

    expect(Object.values(modules.science.constants.elementNames.en)).include(
      modules.science.periodicTableElement(),
    );
    expect(Object.values(modules.science.constants.unitNames.en)).include(
      modules.science.unit(),
    );
  });

  it("vehicle methods return an English value, called with no arguments", () => {
    const modules = freshModules();
    const constants = modules.vehicle.constants;

    expect(constants.vehicleTypes.en).include(modules.vehicle.type());
    expect(constants.fuels.en).include(modules.vehicle.fuel());
    expect(constants.bicycles.en).include(modules.vehicle.bicycle());
  });

  it("animal.type returns an English value, called with no arguments", () => {
    const modules = freshModules();

    expect(modules.animal.constants.animalTypes.en).include(
      modules.animal.type(),
    );
  });

  it("lorem methods return text, called with no arguments", () => {
    const modules = freshModules();

    expect(typeof modules.lorem.word()).toBe("string");
    expect(typeof modules.lorem.words()).toBe("string");
    expect(typeof modules.lorem.sentence()).toBe("string");
    expect(typeof modules.lorem.sentences()).toBe("string");
    expect(typeof modules.lorem.paragraph()).toBe("string");
    expect(typeof modules.lorem.paragraphs()).toBe("string");
    expect(typeof modules.lorem.slug()).toBe("string");
  });
});
