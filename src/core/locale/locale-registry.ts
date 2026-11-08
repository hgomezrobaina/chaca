import { Language } from "./language";
import { LocaleDefinition } from "./locale";
import { ENGLISH } from "../../locales/en";

/**
 * The locales a `ChacaModules` instance knows about. It lives on the instance,
 * not on the process: two instances (two tests, or a library build and the
 * server that embeds it) each get their own registry, so one never leaks into
 * the other.
 */
export class LocaleRegistry {
  private readonly locales = new Map<Language, LocaleDefinition>();

  constructor() {
    this.locales.set(ENGLISH.code, ENGLISH);
  }

  register(locale: LocaleDefinition): void {
    this.locales.set(locale.code, locale);
  }

  find(language: Language): LocaleDefinition | null {
    const found = this.locales.get(language);

    if (found) {
      return found;
    }

    return null;
  }

  english(): LocaleDefinition {
    return ENGLISH;
  }

  registered(): LocaleDefinition[] {
    return [...this.locales.values()];
  }
}
