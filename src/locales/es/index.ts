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
 * The Spanish locale. `word` and `person.{male,female,lastNames}` are the
 * data Chaca shipped before locales existed, moved here unchanged.
 *
 * Every other category is a placeholder (empty, or English's own wording for
 * `date.timeAgoUnits`/`timeAgoTemplate`, which `Record<TimeUnits, string>`
 * requires all six keys of) until `docs/specs/locale-completeness` §4-5
 * fills them in. Nothing reads them in Spanish yet: the methods that accept
 * `language` today are only `word`'s seven and `person.{firstName,lastName,
 * fullName}`.
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
