import { describe, expect, it } from "vitest";
import { en } from "../../src/locales/en";
import { es } from "../../src/locales/es";
import { LocaleDefinition } from "../../src/core/locale/locale";

/**
 * A closed-set category: `es` must have at least as many entries as `en`
 * (parity), because every locale must cover the same fixed universe
 * (`docs/specs/locale-completeness` requirements.md regla 4). Reached from
 * both locales with the same accessor, so a mismatched shape fails to
 * compile rather than silently comparing the wrong thing.
 */
interface ParityCheck {
  name: string;
  values: (locale: LocaleDefinition) => string[];
}

const PARITY_CHECKS: ParityCheck[] = [
  { name: "date.months", values: (l) => l.date.months },
  { name: "date.weekDays", values: (l) => l.date.weekDays },
  {
    name: "date.timeAgoUnits",
    values: (l) => Object.values(l.date.timeAgoUnits),
  },
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
    values: (l) => Object.keys(l.finance.currencyNames),
  },
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
  { name: "science.units", values: (l) => Object.keys(l.science.units) },
  {
    name: "science.elements",
    values: (l) => Object.keys(l.science.elements),
  },
  { name: "vehicle.types", values: (l) => l.vehicle.types },
  { name: "vehicle.fuels", values: (l) => l.vehicle.fuels },
  { name: "vehicle.bicycles", values: (l) => l.vehicle.bicycles },
  { name: "animal.types", values: (l) => l.animal.types },
];

describe("locale completeness: closed-set parity (HU-4, half of E2E-8/E2E-9)", () => {
  it.each(PARITY_CHECKS)(
    "$name: es has at least as many entries as en",
    ({ values }) => {
      const enCount = values(en).length;
      const esCount = values(es).length;

      expect(esCount).toBeGreaterThanOrEqual(enCount);
    },
  );

  it.each(PARITY_CHECKS)(
    "$name: es keeps its own entries unique",
    ({ values }) => {
      const esValues = values(es);

      expect(esValues.length).toBe(new Set(esValues).size);
    },
  );
});
