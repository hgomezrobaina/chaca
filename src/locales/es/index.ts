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
 * The Spanish locale. Complete: every closed-set category is at parity with
 * `en` (`docs/specs/locale-completeness` §4), and every open-set category
 * meets its minimum (§5). `word.{verbs,adjectives,adverbs,prepositions,
 * conjunctions,interjections}` and `person.{male,female,lastNames}` started
 * from the data Chaca shipped before locales existed; §5.1 fixed its
 * spelling errors and six Rioplatense regionalisms (kept for the record in
 * `anexos/regionalismos-retirados.md`) before §5.2-5.4 grew it.
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
    {
      name: "person.{male,female,lastNames}: common Spain/Mexico/Argentina given names and surnames, written from general knowledge of the names these institutes' public frequency statistics report, not a direct extraction of their published lists (see pendientes.md P-17)",
      url: "https://www.ine.es/ · https://www.inegi.org.mx/ · https://www.renaper.gob.ar/",
      license: "own-work",
      date: "2026-11-08",
    },
    {
      name: "word.{nouns,verbs,adjectives,adverbs,interjections}: vocabulary written for this locale in thematic batches, not drawn from any third-party word list",
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
