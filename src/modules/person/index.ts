import {
  ILanguageNames,
  NAMES,
  GENDERS,
  JOBS,
  LANGUAGES,
  PREFIXES,
} from "./constants";
import { ChacaUtils } from "../../core/utils";
import { DatatypeModule } from "../datatype";
import { ZODIAC_SIGN } from "./constants/zodiac";

export type AllLanguages = "es" | "en";

export type LangugeProps = {
  language?: AllLanguages;
};

export type Sex = "male" | "female";

export type NameProps = {
  language?: AllLanguages;
  sex?: Sex;
};

export type SexProps = {
  sex?: Sex;
};

export class PersonModule {
  /** The `male` + `female` lists joined, built once instead of on every call. */
  private readonly namesCache = new WeakMap<ILanguageNames, string[]>();
  private prefixesCache?: string[];

  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
  ) {}

  readonly constants = {
    jobLevels: JOBS.JOB_LEVELS,
    jobAreas: JOBS.JOBS_AREAS,
    genders: GENDERS,
    names: NAMES,
    languages: LANGUAGES,
    prefixes: PREFIXES,
    zodiacSigns: ZODIAC_SIGN,
    sexs: ["Male", "Female"],
  };

  /**
   * @example
   * modules.person.language() // 'Georgian'
   *
   * @returns string
   */
  language(): string {
    return this.utils.oneOfArray(this.constants.languages);
  }

  /**
   * Returns a Job Level
   * @example modules.person.jobLevel() // 'Investor'
   * @returns string
   */
  jobLevel(): string {
    return this.utils.oneOfArray(JOBS.JOB_LEVELS);
  }

  /**
   * Returns a Job Area
   * @example modules.person.jobArea() // 'Supervisor'
   * @returns string
   */
  jobArea(): string {
    return this.utils.oneOfArray(JOBS.JOBS_AREAS);
  }

  /**
   * Returns a person gender
   * @example modules.person.gender() // 'Bigender'
   * @returns string
   */
  gender(): string {
    return this.utils.oneOfArray(this.constants.genders);
  }

  /**
   * Returns a person sex
   * @example modules.person.sex() // 'Male'
   * @returns `Male` | `Female`
   */
  sex(): string {
    return this.utils.oneOfArray(this.constants.sexs);
  }

  /**
   * Returns a first name from a selected lenguage
   * @param args.language (`'en'` | `'es'`). Default `'en'`
   * @param args.sex Person name sex (`'male'` | `'female'`)
   * @example modules.person.firstName() // 'Juan'
   * @returns string
   */
  firstName({ language, sex }: NameProps = {}): string {
    return this.utils.oneOfArray(
      this.filterBySex(this.filterNameByLanguage(language), sex),
    );
  }

  /**
   * Returns a last name from a selected lenguage
   * @param args.language (`en` | `es`). Default `en`
   * @example modules.person.lastName() // 'Scott'
   * @returns string
   */
  lastName({ language }: LangugeProps = {}): string {
    return this.utils.oneOfArray(this.filterNameByLanguage(language).lastNames);
  }

  /**
   * Returns a full name from a selected lenguage
   * @param args.language (`en` | `es`). Default `en`
   * @param args.sex (`male` | `female`)
   * @example
   * modules.person.fullName() // Schema
   * modules.person.fullName() // 'Juan Rodriguez Perez'
   * @returns string
   */
  fullName({ language, sex: isex }: NameProps = {}) {
    const lan = this.filterNameByLanguage(language);

    const sex = isex
      ? isex
      : (this.utils.oneOfArray(["male", "female"]) as Sex);

    const firstName = this.utils.oneOfArray(this.filterBySex(lan, sex));
    const middleName = this.datatypeModule.boolean()
      ? this.utils.oneOfArray(this.filterBySex(lan, sex))
      : undefined;
    const lastNameFirst = this.utils.oneOfArray(lan.lastNames);
    const lastNameSecond = this.utils.oneOfArray(lan.lastNames);

    const fullName = [
      firstName,
      middleName,
      lastNameFirst,
      lastNameSecond,
    ].filter((n) => n !== undefined);

    return fullName.join(" ");
  }

  /**
   * Returns a random zodiac sign.
   *
   * @example
   * modules.person.zodiacSign() // 'Pisces'
   */
  zodiacSign(): string {
    return this.utils.oneOfArray(ZODIAC_SIGN);
  }

  /**
   * Returns a random name prefix
   * @param args.sex Sex of the person. (`male` | `female`)
   * @example modules.person.prefix() // 'Ms.'
   * @returns string
   */
  prefix({ sex }: SexProps = {}): string {
    if (sex === "male" || sex === "female") {
      return this.utils.oneOfArray(this.constants.prefixes[sex]);
    }

    return this.utils.oneOfArray(this.allPrefixes());
  }

  private allPrefixes(): string[] {
    if (!this.prefixesCache) {
      this.prefixesCache = [
        ...this.constants.prefixes.male,
        ...this.constants.prefixes.female,
      ];
    }

    return this.prefixesCache;
  }

  private filterNameByLanguage(
    language: AllLanguages | undefined,
  ): ILanguageNames {
    if (language && typeof language === "string") {
      const nameSelected = NAMES[language];
      if (nameSelected) return nameSelected;
      else return NAMES["en"];
    } else return NAMES["en"];
  }

  private filterBySex(nameSel: ILanguageNames, sex: Sex | undefined): string[] {
    if (sex && typeof sex === "string") {
      const selSex = nameSel[sex];

      if (selSex) {
        return selSex;
      }
    }

    return this.allNames(nameSel);
  }

  private allNames(nameSel: ILanguageNames): string[] {
    const cached = this.namesCache.get(nameSel);

    if (cached) return cached;

    const all = [...nameSel.male, ...nameSel.female];
    this.namesCache.set(nameSel, all);

    return all;
  }
}
