import { Language } from "../../core/locale/language";
import {
  addressLocaleFromJson,
  LocaleDefinition,
} from "../../core/locale/locale";
import address from "./address.json";
import animal from "./animal.json";
import color from "./color.json";
import date from "./date.json";
import finance from "./finance.json";
import lorem from "./lorem.json";
import person from "./person.json";
import science from "./science.json";
import vehicle from "./vehicle.json";
import word from "./word.json";

/**
 * The Spanish locale. `word.{verbs,adjectives,adverbs,prepositions,
 * conjunctions,interjections}` (all but `nouns`) and `person.{male,female,
 * lastNames}` are the data Chaca shipped before locales existed, moved here
 * unchanged — `word.nouns` and `lorem.words` are still too small
 * (`docs/specs/locale-completeness` §5 grows them; §5.1 also cleans up a
 * handful of pre-existing spelling errors in that inherited data). Every
 * closed-set category (§4) is complete and at parity with `en`.
 */
export const es: LocaleDefinition = {
  code: Language.Spanish,
  sources: [
    {
      name: "Chaca's own Spanish data, as it shipped before locales existed",
      url: "https://github.com/hgomezrobaina/chaca",
      license: "MIT",
      date: "2026-11-08",
    },
    {
      name: "Unicode CLDR: Spanish month and weekday names (date.json), country names (address.json), currency names (finance.json) and language names (person.json)",
      url: "https://github.com/unicode-org/cldr",
      license: "Unicode-DFS-2016",
      date: "2026-11-08",
    },
    {
      name: "Written for this locale, translating Chaca's own English catalogs 1:1 (person.{genders,jobAreas,jobLevels,zodiacSigns,sexs,prefixes}, finance.{accountTypes,transactionTypes,subscriptionPlans}, science.{elements,units} verified against IUPAC/SI nomenclature, color.human, vehicle.{types,fuels,bicycles}, animal.types)",
      url: "https://github.com/hgomezrobaina/chaca",
      license: "own-work",
      date: "2026-11-08",
    },
  ],
  address: addressLocaleFromJson(address),
  animal,
  color,
  date,
  finance,
  lorem,
  person,
  science,
  vehicle,
  word,
};

export const SPANISH = es;
