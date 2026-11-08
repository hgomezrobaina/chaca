import { COUNTRY_CODE, COUNTRY_LIST } from "./constants/countries";
import { TIME_ZONE } from "./constants/time-zone";
import { CARDINAL_DIRECTIONS } from "./constants/cardinal-directions";
import { ORDINAL } from "./constants/ordinal";
import { ChacaUtils } from "../../core/utils";
import { DatatypeModule } from "../datatype";

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

export type CountryProps = {
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
  ) {}

  readonly constants = {
    timeZones: TIME_ZONE,
    countries: COUNTRY_LIST,
    countriesCode: COUNTRY_CODE,
    cardinalDirections: CARDINAL_DIRECTIONS,
    ordinalDirection: ORDINAL,
  };

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
   * Returns a cardinal direction
   * @example modules.address.cardinalDirection()// 'North'
   * @returns string
   */
  cardinalDirection(): string {
    return this.utils.oneOfArray(this.constants.cardinalDirections);
  }

  /**
   * Returns a country
   * @param args.continent Continent of the country that you want
   * @example modules.address.country() // 'Spain'
   * @returns string
   */
  country({ continent }: CountryProps = {}): string {
    if (continent && typeof continent === "string") {
      const filterList = COUNTRY_LIST.filter(
        (el) => el.continent === continent,
      );

      if (filterList.length > 0) {
        return this.utils.oneOfArray(filterList.map((el) => el.country));
      }
    }

    return this.utils.oneOfArray(COUNTRY_LIST.map((el) => el.country));
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
   * Returns a random ordinal direction (northwest, southeast, etc).
   *
   * @example
   * modules.address.ordinalDirection() // 'Northeast'
   */
  ordinalDirection(): string {
    return this.utils.oneOfArray(ORDINAL);
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
