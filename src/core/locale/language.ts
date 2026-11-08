/**
 * The languages Chaca ships a locale for. A method that accepts `language` only
 * ever receives one of these: a locale published by a third party has no member
 * here, so it cannot be requested by `language` yet (see the provider-registry
 * roadmap item).
 */
export enum Language {
  English = "en",
  Spanish = "es",
}

export interface LanguageProps {
  language?: Language;
}
