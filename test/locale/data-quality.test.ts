import { describe, expect, it } from "vitest";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";
import { LocaleDefinition } from "../../src/core/locale/locale";

interface CategoryCheck {
  name: string;
  values: (locale: LocaleDefinition) => string[];
}

/** Every string-array category of a `LocaleDefinition`, across both locales. */
const ALL_CATEGORIES: CategoryCheck[] = [
  { name: "word.verbs", values: (l) => l.word.verbs },
  { name: "word.conjunctions", values: (l) => l.word.conjunctions },
  { name: "word.interjections", values: (l) => l.word.interjections },
  { name: "word.prepositions", values: (l) => l.word.prepositions },
  { name: "word.adverbs", values: (l) => l.word.adverbs },
  { name: "word.adjectives", values: (l) => l.word.adjectives },
  { name: "word.nouns", values: (l) => l.word.nouns },
  { name: "person.male", values: (l) => l.person.male },
  { name: "person.female", values: (l) => l.person.female },
  { name: "person.lastNames", values: (l) => l.person.lastNames },
  { name: "person.genders", values: (l) => l.person.genders },
  { name: "person.jobAreas", values: (l) => l.person.jobAreas },
  { name: "person.jobLevels", values: (l) => l.person.jobLevels },
  { name: "person.languages", values: (l) => l.person.languages },
  { name: "person.zodiacSigns", values: (l) => l.person.zodiacSigns },
  { name: "person.sexs", values: (l) => l.person.sexs },
  { name: "person.prefixes.male", values: (l) => l.person.prefixes.male },
  {
    name: "person.prefixes.female",
    values: (l) => l.person.prefixes.female,
  },
  { name: "date.months", values: (l) => l.date.months },
  { name: "date.weekDays", values: (l) => l.date.weekDays },
  {
    name: "address.countries",
    values: (l) => l.address.countries.map((c) => c.country),
  },
  {
    name: "address.cardinalDirections",
    values: (l) => l.address.cardinalDirections,
  },
  {
    name: "address.ordinalDirections",
    values: (l) => l.address.ordinalDirections,
  },
  { name: "color.human", values: (l) => l.color.human },
  { name: "finance.accountTypes", values: (l) => l.finance.accountTypes },
  {
    name: "finance.transactionTypes",
    values: (l) => l.finance.transactionTypes,
  },
  {
    name: "finance.subscriptionPlans",
    values: (l) => l.finance.subscriptionPlans,
  },
  {
    name: "finance.currencyNames",
    values: (l) => Object.values(l.finance.currencyNames),
  },
  { name: "science.units", values: (l) => Object.values(l.science.units) },
  {
    name: "science.elements",
    values: (l) => Object.values(l.science.elements),
  },
  { name: "vehicle.types", values: (l) => l.vehicle.types },
  { name: "vehicle.fuels", values: (l) => l.vehicle.fuels },
  { name: "vehicle.bicycles", values: (l) => l.vehicle.bicycles },
  { name: "animal.types", values: (l) => l.animal.types },
  { name: "lorem.words", values: (l) => l.lorem.words },
];

const REGISTERED_LOCALES: { name: string; locale: LocaleDefinition }[] = [
  { name: "en", locale: en },
  { name: "es", locale: es },
];

describe("locale data quality (E2E-10): no repeats, no empty strings, no padding", () => {
  for (const { name: localeName, locale } of REGISTERED_LOCALES) {
    it.each(ALL_CATEGORIES)(
      `${localeName}'s $name has no repeated entries`,
      ({ values }) => {
        const entries = values(locale);

        expect(entries.length).toBe(new Set(entries).size);
      },
    );

    it.each(ALL_CATEGORIES)(
      `${localeName}'s $name has no empty or padded entries`,
      ({ values }) => {
        const entries = values(locale);

        for (const entry of entries) {
          expect(entry.length).toBeGreaterThan(0);
          expect(entry).toBe(entry.trim());
        }
      },
    );
  }
});

describe("the data errors the competitor-research report found are fixed (E2E-12)", () => {
  it("es.word.nouns no longer has the misspellings", () => {
    expect(es.word.nouns).not.toContain("relifión");
    expect(es.word.nouns).not.toContain("estusiasmo");
  });

  it("es.person.male no longer has 'Jorde'", () => {
    expect(es.person.male).not.toContain("Jorde");
    expect(es.person.male).toContain("Jorge");
  });

  it("es.person.lastNames no longer has 'Dóminguez' or 'Iglesisas'", () => {
    expect(es.person.lastNames).not.toContain("Dóminguez");
    expect(es.person.lastNames).not.toContain("Iglesisas");
    expect(es.person.lastNames).toContain("Domínguez");
    expect(es.person.lastNames).toContain("Iglesias");
  });

  it("'Belén' moved out of es.person.male and into es.person.female", () => {
    expect(es.person.male).not.toContain("Belen");
    expect(es.person.male).not.toContain("Belén");
    expect(es.person.female).toContain("Belén");
  });
});
