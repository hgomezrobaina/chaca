import { Language } from "./language";
import { TimeUnits } from "../../modules/date";
import { Continent } from "../../modules/address";

/** Where a locale's strings came from, so a consumer can audit the license. */
export interface LocaleSource {
  /** What the data is and where it came from. */
  name: string;
  url: string;
  /** SPDX identifier, or `"own-work"` when it was written for Chaca. */
  license: string;
  /** When it was consulted or written, in ISO-8601. */
  date: string;
}

export interface PersonLocale {
  male: string[];
  female: string[];
  lastNames: string[];
  prefixes: { male: string[]; female: string[] };
  genders: string[];
  jobAreas: string[];
  jobLevels: string[];
  languages: string[];
  zodiacSigns: string[];
  sexs: string[];
}

export interface WordLocale {
  verbs: string[];
  conjunctions: string[];
  interjections: string[];
  prepositions: string[];
  adverbs: string[];
  adjectives: string[];
  nouns: string[];
}

export interface DateLocale {
  months: string[];
  weekDays: string[];
  timeAgoUnits: Record<TimeUnits, string>;
  /** `{amount}` and `{unit}` are replaced; order is the locale's to decide. */
  timeAgoTemplate: string;
}

export interface AddressLocale {
  /** Keeps the continent alongside the name: `address.country({ continent })` filters by it. */
  countries: { country: string; continent: Continent }[];
  cardinalDirections: string[];
  ordinalDirections: string[];
}

/**
 * `resolveJsonModule` infers a JSON string field as `string`, never as a
 * literal union. Each locale's data was generated from code that already
 * satisfies `Continent`, so narrowing it back here is the one place that
 * needs to say so.
 */
export function addressLocaleFromJson(data: {
  countries: { country: string; continent: string }[];
  cardinalDirections: string[];
  ordinalDirections: string[];
}): AddressLocale {
  return {
    countries: data.countries.map((entry) => {
      return {
        country: entry.country,
        continent: entry.continent as Continent,
      };
    }),
    cardinalDirections: data.cardinalDirections,
    ordinalDirections: data.ordinalDirections,
  };
}

export interface ColorLocale {
  human: string[];
}

export interface FinanceLocale {
  accountTypes: string[];
  transactionTypes: string[];
  subscriptionPlans: string[];
  /** Keyed by the ISO currency code; the rest of the money ticket stays in the module. */
  currencyNames: Record<string, string>;
}

export interface ScienceLocale {
  /** Keyed by `UNITS[number].key`. */
  units: Record<string, string>;
  /** Keyed by the element's chemical symbol. */
  elements: Record<string, string>;
}

export interface VehicleLocale {
  types: string[];
  fuels: string[];
  bicycles: string[];
}

export interface AnimalLocale {
  types: string[];
}

export interface LoremLocale {
  /** Vocabulary `lorem-ipsum` draws from when `language` is this locale. */
  words: string[];
}

/**
 * Everything a locale must bring. Every category is required: a locale that
 * only covers part of what depends on language is not representable by this
 * type, which is what makes completeness checkable by a test instead of by
 * convention.
 */
export interface LocaleDefinition {
  code: Language;
  sources: LocaleSource[];
  person: PersonLocale;
  word: WordLocale;
  date: DateLocale;
  address: AddressLocale;
  color: ColorLocale;
  finance: FinanceLocale;
  science: ScienceLocale;
  vehicle: VehicleLocale;
  animal: AnimalLocale;
  lorem: LoremLocale;
}
