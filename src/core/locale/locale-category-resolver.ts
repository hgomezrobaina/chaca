import { Language } from "./language";
import { LocaleDefinition } from "./locale";
import { LocaleRegistry } from "./locale-registry";

interface ResolveProps<T> {
  language: Language | undefined;
  select: (locale: LocaleDefinition) => T;
}

/**
 * What `byLanguage` returns: `en` is always present (`LocaleRegistry`'s
 * constructor guarantees it), every other locale is only there if it was
 * registered. Typing it this way, instead of a uniform `Partial`, is what
 * lets `modules.<module>.constants.<category>.en` read without a null
 * check at every call site.
 */
export type LocaleCategoryMap<T> = Partial<Record<Language, T>> & {
  [Language.English]: T;
};

/**
 * Resolves which locale's category a method should read. Pulled out of the
 * per-module `filterWords`/`filterNameByLanguage` methods that duplicated this
 * exact fallback, so every localizable method shares one rule: the requested
 * language if it is registered, English otherwise — silently, by design (a
 * locale that is not registered behaves like one that was never imported).
 */
export class LocaleCategoryResolver {
  constructor(private readonly registry: LocaleRegistry) {}

  execute<T>({ language, select }: ResolveProps<T>): T {
    if (language) {
      const locale = this.registry.find(language);

      if (locale) {
        return select(locale);
      }
    }

    return select(this.registry.english());
  }

  /**
   * One value per registered locale, keyed by its code. A locale that was
   * never registered has no key here, which is what keeps `modules.<x>.constants`
   * honest about what is actually loaded.
   */
  byLanguage<T>(select: (locale: LocaleDefinition) => T): LocaleCategoryMap<T> {
    const result: LocaleCategoryMap<T> = {
      [Language.English]: select(this.registry.english()),
    };

    for (const locale of this.registry.registered()) {
      result[locale.code] = select(locale);
    }

    return result;
  }
}
