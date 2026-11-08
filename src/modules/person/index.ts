import { ChacaUtils } from "../../core/utils";
import { DatatypeModule } from "../datatype";
import { Language, LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";
import { PersonLocale } from "../../core/locale/locale";

export type Sex = "male" | "female";

export type NameProps = LanguageProps & {
  sex?: Sex;
};

export type SexProps = LanguageProps & {
  sex?: Sex;
};

export class PersonModule {
  /** The `male` + `female` lists joined, built once instead of on every call. */
  private readonly namesCache = new WeakMap<PersonLocale, string[]>();
  /** Same memoization as `namesCache`, per registered locale's prefixes. */
  private readonly prefixesCache = new WeakMap<PersonLocale, string[]>();

  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      jobLevels: this.locales.byLanguage((locale) => locale.person.jobLevels),
      jobAreas: this.locales.byLanguage((locale) => locale.person.jobAreas),
      genders: this.locales.byLanguage((locale) => locale.person.genders),
      names: this.locales.byLanguage((locale) => {
        return {
          male: locale.person.male,
          female: locale.person.female,
          lastNames: locale.person.lastNames,
        };
      }),
      languages: this.locales.byLanguage((locale) => locale.person.languages),
      prefixes: this.locales.byLanguage((locale) => locale.person.prefixes),
      zodiacSigns: this.locales.byLanguage((locale) => {
        return locale.person.zodiacSigns;
      }),
      sexs: this.locales.byLanguage((locale) => locale.person.sexs),
    };
  }

  /**
   * Returns a language name from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.person.language() // 'Georgian'
   *
   * @returns string
   */
  language({ language }: LanguageProps = {}): string {
    const languages = this.locales.execute({
      language,
      select: (locale) => locale.person.languages,
    });

    return this.utils.oneOfArray(languages);
  }

  /**
   * Returns a Job Level from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.jobLevel() // 'Investor'
   * @returns string
   */
  jobLevel({ language }: LanguageProps = {}): string {
    const jobLevels = this.locales.execute({
      language,
      select: (locale) => locale.person.jobLevels,
    });

    return this.utils.oneOfArray(jobLevels);
  }

  /**
   * Returns a Job Area from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.jobArea() // 'Supervisor'
   * @returns string
   */
  jobArea({ language }: LanguageProps = {}): string {
    const jobAreas = this.locales.execute({
      language,
      select: (locale) => locale.person.jobAreas,
    });

    return this.utils.oneOfArray(jobAreas);
  }

  /**
   * Returns a person gender from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.gender() // 'Bigender'
   * @returns string
   */
  gender({ language }: LanguageProps = {}): string {
    const genders = this.locales.execute({
      language,
      select: (locale) => locale.person.genders,
    });

    return this.utils.oneOfArray(genders);
  }

  /**
   * Returns a person sex from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.sex() // 'Male'
   * @returns `Male` | `Female`
   */
  sex({ language }: LanguageProps = {}): string {
    const sexs = this.locales.execute({
      language,
      select: (locale) => locale.person.sexs,
    });

    return this.utils.oneOfArray(sexs);
  }

  /**
   * Returns a first name from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @param args.sex Person name sex (`'male'` | `'female'`)
   * @example modules.person.firstName() // 'Juan'
   * @returns string
   */
  firstName({ language, sex }: NameProps = {}): string {
    return this.utils.oneOfArray(this.filterBySex(this.names(language), sex));
  }

  /**
   * Returns a last name from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.lastName() // 'Scott'
   * @returns string
   */
  lastName({ language }: LanguageProps = {}): string {
    return this.utils.oneOfArray(this.names(language).lastNames);
  }

  /**
   * Returns a full name from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @param args.sex (`male` | `female`)
   * @example
   * modules.person.fullName() // Schema
   * modules.person.fullName() // 'Juan Rodriguez Perez'
   * @returns string
   */
  fullName({ language, sex: isex }: NameProps = {}) {
    const names = this.names(language);

    const sex = isex
      ? isex
      : (this.utils.oneOfArray(["male", "female"]) as Sex);

    const firstName = this.utils.oneOfArray(this.filterBySex(names, sex));
    const middleName = this.datatypeModule.boolean()
      ? this.utils.oneOfArray(this.filterBySex(names, sex))
      : undefined;
    const lastNameFirst = this.utils.oneOfArray(names.lastNames);
    const lastNameSecond = this.utils.oneOfArray(names.lastNames);

    const fullName = [
      firstName,
      middleName,
      lastNameFirst,
      lastNameSecond,
    ].filter((n) => n !== undefined);

    return fullName.join(" ");
  }

  /**
   * Returns a random zodiac sign from a registered locale.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.person.zodiacSign() // 'Pisces'
   */
  zodiacSign({ language }: LanguageProps = {}): string {
    const zodiacSigns = this.locales.execute({
      language,
      select: (locale) => locale.person.zodiacSigns,
    });

    return this.utils.oneOfArray(zodiacSigns);
  }

  /**
   * Returns a random name prefix from a registered locale.
   * @param args.sex Sex of the person. (`male` | `female`)
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.person.prefix() // 'Ms.'
   * @returns string
   */
  prefix({ sex, language }: SexProps = {}): string {
    const person = this.locales.execute({
      language,
      select: (locale) => locale.person,
    });

    if (sex === "male" || sex === "female") {
      return this.utils.oneOfArray(person.prefixes[sex]);
    }

    return this.utils.oneOfArray(this.allPrefixes(person));
  }

  private allPrefixes(person: PersonLocale): string[] {
    const cached = this.prefixesCache.get(person);

    if (cached) return cached;

    const all = [...person.prefixes.male, ...person.prefixes.female];
    this.prefixesCache.set(person, all);

    return all;
  }

  private names(language: Language | undefined): PersonLocale {
    return this.locales.execute({
      language,
      select: (locale) => locale.person,
    });
  }

  private filterBySex(nameSel: PersonLocale, sex: Sex | undefined): string[] {
    if (sex && typeof sex === "string") {
      const selSex = nameSel[sex];

      if (selSex) {
        return selSex;
      }
    }

    return this.allNames(nameSel);
  }

  private allNames(nameSel: PersonLocale): string[] {
    const cached = this.namesCache.get(nameSel);

    if (cached) return cached;

    const all = [...nameSel.male, ...nameSel.female];
    this.namesCache.set(nameSel, all);

    return all;
  }
}
