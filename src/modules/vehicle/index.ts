import { ChacaUtils } from "../../core/utils";
import { BICYCLE, FUEL, MANUFACTURER, MODEL, TYPE, WMI } from "./constants";
import {
  VIN_CHARS,
  VIN_TRANSLITERATION,
  VIN_WEIGHTS,
  VIN_YEAR_CODES,
  VIN_YEAR_CYCLE_START,
} from "./constants/vin";

export interface VinConfig {
  /**
   * Model year to encode in the VIN (position 10). Defaults to a random year
   * within the last 25 years.
   *
   * Two years 30 years apart encode to the same character (e.g. 1995 and
   * 2025 both give `'S'`) — that's a property of the real standard, which
   * reuses its 30 model-year codes on a cycle, not a limitation of this
   * generator.
   */
  year?: number;
}

export class VehicleModule {
  constructor(private readonly utils: ChacaUtils) {}

  readonly constants = {
    bicycles: BICYCLE,
    fuels: FUEL,
    manufacturers: MANUFACTURER,
    models: MODEL,
    vehicleTypes: TYPE,
    wmi: WMI,
  };

  /**
   * Returns a bicycle type
   * @example modules.vehicle.bicycle() // 'BMX Bicycle'
   * @returns string
   */
  bicycle(): string {
    return this.utils.oneOfArray(BICYCLE);
  }

  /**
   * Returns a manufacturer name
   * @example modules.vehicle.manufacturer() // 'BMW'
   * @returns string
   */
  manufacturer(): string {
    return this.utils.oneOfArray(MANUFACTURER);
  }

  /**
   * Returns a vehicle model name
   * @example modules.vehicle.model() // 'Model S'
   * @returns string
   */
  model(): string {
    return this.utils.oneOfArray(MODEL);
  }

  /**
   * Returns a vehicle type
   * @example modules.vehicle.type() // 'Coupe'
   * @returns string
   */
  type(): string {
    return this.utils.oneOfArray(TYPE);
  }

  /**
   * Returns a vehicle name
   * @example modules.vehicle.vehicle() // 'BMW Explorer'
   * @returns string
   */
  vehicle(): string {
    return `${this.manufacturer()} ${this.model()}`;
  }

  /**
   * Returns a fuel type
   * @example modules.vehicle.fuel() // 'Diesel'
   * @returns string
   */
  fuel(): string {
    return this.utils.oneOfArray(FUEL);
  }

  /**
   * Returns a 17-character Vehicle Identification Number ([ISO 3779](https://en.wikipedia.org/wiki/Vehicle_identification_number)).
   * The check digit (position 9) is computed with the same algorithm real
   * VIN validators use, so the result validates as genuinely correct, not
   * just plausible-looking.
   *
   * @example modules.vehicle.vin() // '1HGBH41JXMN109186'
   * @example modules.vehicle.vin({ year: 2018 }) // 'WBA5A5C50JD123456'
   * @returns string
   */
  vin(config: VinConfig = {}): string {
    const wmi = this.utils.oneOfArray(WMI);

    const vds = this.utils.replaceSymbols("VVVVV", {
      symbols: { V: VIN_CHARS },
    });

    const currentYear = new Date().getFullYear();
    const recentYears = Array.from({ length: 25 }, (_, i) => currentYear - i);
    const year = config.year ?? this.utils.oneOfArray(recentYears);

    const yearCode = this.vinYearCode(year);
    const plantCode = this.utils.oneOfArray(VIN_CHARS);
    const serial = this.utils.replaceSymbols("######");

    // la posición 9 (check digit) no se conoce todavía: se rellena con '0'
    // porque su peso en la fórmula es 0 y no afecta al cálculo
    const draft = `${wmi}${vds}0${yearCode}${plantCode}${serial}`;
    const checkDigit = this.vinCheckDigit(draft);

    return `${wmi}${vds}${checkDigit}${yearCode}${plantCode}${serial}`;
  }

  private vinYearCode(year: number): string {
    const offset =
      (((year - VIN_YEAR_CYCLE_START) % 30) + 30) % VIN_YEAR_CODES.length;

    return VIN_YEAR_CODES[offset];
  }

  private vinCheckDigit(vin: string): string {
    const sum = [...vin].reduce((acc, char, i) => {
      const value = /\d/.test(char) ? Number(char) : VIN_TRANSLITERATION[char];

      return acc + value * VIN_WEIGHTS[i];
    }, 0);

    const remainder = sum % 11;

    return remainder === 10 ? "X" : String(remainder);
  }
}
