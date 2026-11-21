import { COUNTRY_CODE } from "./constants/countries";
import { TIME_ZONE } from "./constants/time-zone";
import { ChacaUtils } from "../../core/utils";
import { DatatypeModule } from "../datatype";
import { LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";

export type ZipCodeProps = {
  format?: string;
};

export type Continent =
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Europe"
  | "South America"
  | "North America"
  | "Antarctica";

export type CountryProps = LanguageProps & {
  continent?: Continent;
};

export type LatitudeProps = {
  max?: number;
  min?: number;
  precision?: number;
};

export type LongitudProps = {
  max?: number;
  min?: number;
  precision?: number;
};

export class AddressModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      timeZones: TIME_ZONE,
      countriesCode: COUNTRY_CODE,
      countries: this.locales.byLanguage((locale) => locale.address.countries),
      cardinalDirections: this.locales.byLanguage((locale) => {
        return locale.address.cardinalDirections;
      }),
      ordinalDirection: this.locales.byLanguage((locale) => {
        return locale.address.ordinalDirections;
      }),
    };
  }

  /**
   * Returns a zip code
   * @param args.format format of the zip code. Default '#####'
   * @example
   * modules.address.zipCode() // '62581'
   * modules.address.zipCode({ format: '###' }) // '453'
   * @returns string
   */
  zipCode({ format: iformat }: ZipCodeProps = {}): string {
    const format = typeof iformat === "string" ? iformat : "#####";
    return this.utils.replaceSymbols(format);
  }

  /**
   * Returns a time zone
   * @example modules.address.timeZone() // "Asia/Magadan"
   * @returns string
   */
  timeZone(): string {
    return this.utils.oneOfArray(TIME_ZONE);
  }

  /**
   * Returns a cardinal direction from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.address.cardinalDirection()// 'North'
   * @returns string
   */
  cardinalDirection({ language }: LanguageProps = {}): string {
    const directions = this.locales.execute({
      language,
      select: (locale) => locale.address.cardinalDirections,
    });

    return this.utils.oneOfArray(directions);
  }

  /**
   * Returns a country from a registered locale.
   * @param args.continent Continent of the country that you want
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.address.country() // 'Spain'
   * @returns string
   */
  country({ continent, language }: CountryProps = {}): string {
    const countries = this.locales.execute({
      language,
      select: (locale) => locale.address.countries,
    });

    if (continent && typeof continent === "string") {
      const filterList = countries.filter((el) => el.continent === continent);

      if (filterList.length > 0) {
        return this.utils.oneOfArray(filterList.map((el) => el.country));
      }
    }

    return this.utils.oneOfArray(countries.map((el) => el.country));
  }

  /**
   * Returns a country name code
   * @example modules.address.countryCode() // 'CU'
   * @returns string
   */
  countryCode(): string {
    return this.utils.oneOfArray(COUNTRY_CODE);
  }

  /**
   * Returns a random ordinal direction (northwest, southeast, etc) from a
   * registered locale.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.address.ordinalDirection() // 'Northeast'
   */
  ordinalDirection({ language }: LanguageProps = {}): string {
    const directions = this.locales.execute({
      language,
      select: (locale) => locale.address.ordinalDirections,
    });

    return this.utils.oneOfArray(directions);
  }

  /**
   * Generates a random latitude.
   *
   * @param options.max The upper bound for the latitude to generate. Defaults to `90`.
   * @param options.min The lower bound for the latitude to generate. Defaults to `-90`.
   * @param options.precision The number of decimal points of precision for the latitude. Defaults to `4`.
   *
   * @example
   * modules.address.latitude() // -30.9501
   * modules.address.latitude({ max: 10 }) // 5.7225
   * modules.address.latitude({ max: 10, min: -10 }) // -9.6273
   * modules.address.latitude({ max: 10, min: -10, precision: 5 }) // 2.68452
   */
  latitude(options: LatitudeProps = {}): number {
    const { max = 90, min = -90, precision = 4 } = options;

    return this.datatypeModule.float({
      min: min,
      max: max,
      precision: precision,
    });
  }

  /**
   * Generates a random longitude.
   *
   * @param options.max The upper bound for the longitude to generate. Defaults to `180`.
   * @param options.min The lower bound for the longitude to generate. Defaults to `-180`.
   * @param options.precision The number of decimal points of precision for the longitude. Defaults to `4`.
   *
   * @example
   * modules.address.longitude() // -30.9501
   * modules.address.longitude({ max: 10 }) // 5.7225
   * modules.address.longitude({ max: 10, min: -10 }) // -9.6273
   * modules.address.longitude({ max: 10, min: -10, precision: 5 }) // 2.68452
   */
  longitude(options: LongitudProps = {}): number {
    const { max = 180, min = -180, precision = 4 } = options;

    return this.datatypeModule.float({
      max: max,
      min: min,
      precision: precision,
    });
  }
}
