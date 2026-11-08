import { ChacaUtils } from "../../core/utils";
import { Language, LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";
import { WordLocale } from "../../core/locale/locale";

export class WordModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      words: this.locales.byLanguage((locale) => locale.word),
    };
  }

  /**
   * Returns an adjective from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.adjective() // 'clever'
   * @returns string
   */
  adjective({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).adjectives);
  }

  /**
   * Returns a conjunction from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.conjunction() // 'but'
   * @returns string
   */
  conjunction({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).conjunctions);
  }

  /**
   * @deprecated Misspelled alias of {@link WordModule.conjunction}, kept for
   * compatibility. Use `conjunction` instead.
   */
  conjuction(args?: LanguageProps): string {
    return this.conjunction(args);
  }

  /**
   * Returns an interjection from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.interjection() // 'hey!'
   * @returns string
   */
  interjection({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).interjections);
  }

  /**
   * Returns a preposition from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.preposition() // 'at'
   * @returns string
   */
  preposition({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).prepositions);
  }

  /**
   * Returns an adverb from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.adverb() // 'here'
   * @returns string
   */
  adverb({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).adverbs);
  }

  /**
   * Returns a verb from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.verb() // 'had'
   * @returns string
   */
  verb({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).verbs);
  }

  /**
   * Returns a noun from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.word.noun() // 'car'
   * @returns string
   */
  noun({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.word(language).nouns);
  }

  private word(language: Language | undefined): WordLocale {
    return this.locales.execute({ language, select: (locale) => locale.word });
  }
}
