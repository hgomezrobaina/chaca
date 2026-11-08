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
 * The package's built-in locale, registered from `LocaleRegistry`'s
 * constructor so calling any localizable method without `language`, or
 * without registering any other locale, behaves exactly as it did before
 * locales existed.
 *
 * Typed explicitly as `LocaleDefinition` so `tsup`'s `.d.ts` output carries
 * that interface instead of inferring a literal type over thousands of
 * strings (risk P-14 in `pendientes.md`).
 */
export const en: LocaleDefinition = {
  code: Language.English,
  sources: [
    {
      name: "Chaca's own English data, as it shipped before locales existed",
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

export const ENGLISH = en;
