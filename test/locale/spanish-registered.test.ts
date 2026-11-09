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
    const words = modules.word.constants.words.es!;

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
    const names = modules.person.constants.names.es!;

    expect([...names.female, ...names.male]).include(
      modules.person.firstName({ language: Language.Spanish }),
    );
    expect(names.lastNames).include(
      modules.person.lastName({ language: Language.Spanish }),
    );
  });

  it("person's other methods return a Spanish value when asked for Language.Spanish", () => {
    const constants = modules.person.constants;

    expect(constants.genders.es).include(
      modules.person.gender({ language: Language.Spanish }),
    );
    expect(constants.jobAreas.es).include(
      modules.person.jobArea({ language: Language.Spanish }),
    );
    expect(constants.jobLevels.es).include(
      modules.person.jobLevel({ language: Language.Spanish }),
    );
    expect(constants.languages.es).include(
      modules.person.language({ language: Language.Spanish }),
    );
    expect(constants.sexs.es).include(
      modules.person.sex({ language: Language.Spanish }),
    );
    expect(constants.zodiacSigns.es).include(
      modules.person.zodiacSign({ language: Language.Spanish }),
    );
    expect([
      ...constants.prefixes.es!.male,
      ...constants.prefixes.es!.female,
    ]).include(modules.person.prefix({ language: Language.Spanish }));
  });

  it("date methods return a Spanish value when asked for Language.Spanish", () => {
    expect(modules.date.constants.months.es).include(
      modules.date.month({ language: Language.Spanish }),
    );
    expect(modules.date.constants.weekDays.es).include(
      modules.date.weekDay({ language: Language.Spanish }),
    );
    expect(modules.date.timeAgo({ language: Language.Spanish })).toMatch(
      /^hace \d+ (años|segundos|minutos|días|horas|meses)$/,
    );
  });

  it("address methods return a Spanish value when asked for Language.Spanish", () => {
    const constants = modules.address.constants;

    expect(constants.countries.es!.map((c) => c.country)).include(
      modules.address.country({ language: Language.Spanish }),
    );
    expect(constants.cardinalDirections.es).include(
      modules.address.cardinalDirection({ language: Language.Spanish }),
    );
    expect(constants.ordinalDirection.es).include(
      modules.address.ordinalDirection({ language: Language.Spanish }),
    );
  });

  it("color.human returns a Spanish value when asked for Language.Spanish", () => {
    expect(modules.color.constants.human.es).include(
      modules.color.human({ language: Language.Spanish }),
    );
  });

  it("finance methods return a Spanish value when asked for Language.Spanish", () => {
    const constants = modules.finance.constants;

    expect(constants.accountTypes.es).include(
      modules.finance.accountType({ language: Language.Spanish }),
    );
    expect(constants.subscriptionPlans.es).include(
      modules.finance.subscriptionPlan({ language: Language.Spanish }),
    );
    expect(constants.transactionTypes.es).include(
      modules.finance.transaction({ language: Language.Spanish }),
    );
    expect(Object.values(constants.currencyNames.es!)).include(
      modules.finance.currencyMoneyName({ language: Language.Spanish }),
    );
  });

  it("science methods return a Spanish value when asked for Language.Spanish", () => {
    expect(Object.values(modules.science.constants.elementNames.es!)).include(
      modules.science.periodicTableElement({ language: Language.Spanish }),
    );
    expect(Object.values(modules.science.constants.unitNames.es!)).include(
      modules.science.unit({ language: Language.Spanish }),
    );
  });

  it("vehicle methods return a Spanish value when asked for Language.Spanish", () => {
    const constants = modules.vehicle.constants;

    expect(constants.vehicleTypes.es).include(
      modules.vehicle.type({ language: Language.Spanish }),
    );
    expect(constants.fuels.es).include(
      modules.vehicle.fuel({ language: Language.Spanish }),
    );
    expect(constants.bicycles.es).include(
      modules.vehicle.bicycle({ language: Language.Spanish }),
    );
  });

  it("animal.type returns a Spanish value when asked for Language.Spanish", () => {
    expect(modules.animal.constants.animalTypes.es).include(
      modules.animal.type({ language: Language.Spanish }),
    );
  });

  it("lorem methods return only Spanish vocabulary when asked for Language.Spanish", () => {
    const vocabulary = es.lorem.words;

    function expectOnlySpanishVocabulary(text: string): void {
      const words = text
        .toLowerCase()
        .replace(/[.,]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 0);

      for (const word of words) {
        expect(vocabulary).toContain(word);
      }
    }

    expectOnlySpanishVocabulary(
      modules.lorem.word({ language: Language.Spanish }),
    );
    expectOnlySpanishVocabulary(
      modules.lorem.words({ language: Language.Spanish, count: 8 }),
    );
    expectOnlySpanishVocabulary(
      modules.lorem.sentence({ language: Language.Spanish }),
    );
  });
});
