import { ChacaUtils } from "../../core/utils";
import { SPECIAL_CHARACTERS } from "./constants/special-characters";
import {
  LOWER_CHARACTERS,
  MIXED_CHARACTERS,
  UPPER_CHARACTERS,
} from "./constants/characters";
import { ChacaError } from "../../errors";

export type Case = "lower" | "upper" | "mixed";

export type BigIntProps = {
  min?: bigint;
  max?: bigint;
};
export type NumericProps = {
  allowLeadingZeros?: boolean;
  length?: number;
  prefix?: string;
  banned?: string[];
};

export type AlphaNumericProps = {
  length?: number;
  case?: Case;
  banned?: string[] | string;
  prefix?: string;
};

export type BinaryCodeProps = {
  length?: number;
  prefix?: string;
};

export type OctalProps = {
  length?: number;
  prefix?: string;
};

export type FloatProps = {
  min?: number;
  max?: number;
  precision?: number;
};

export type NumberProps = {
  min?: number;
  max?: number;
  precision?: number;
};

export type IntProps = {
  min?: number;
  max?: number;
};

export type HexadecimalProps = {
  length?: number;
  case?: Case;
};

export type MatrixProps = {
  x_size?: number;
  y_size?: number;
  min?: number;
  max?: number;
  precision?: number;
};

export type CharacterProps = {
  case?: Case;
};

export type CharactersProps = {
  length?: number;
  case?: Case;
};

export class DatatypeModule {
  private readonly MIN_RANDOM_VALUE = -999999;
  private readonly MAX_RANDOM_VALUE = 999999;
  private readonly MAX_PRECISION = 16;

  constructor(private readonly utils: ChacaUtils) {}

  readonly constants = {
    upperCharacters: UPPER_CHARACTERS,
    lowerCharacters: LOWER_CHARACTERS,
    mixedCharacters: MIXED_CHARACTERS,
    specialCharacters: SPECIAL_CHARACTERS,
    numbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  };

  /**
   * Returns a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#bigint_type) number.
   * The bounds are inclusive.
   *
   * @param args.min Lower bound for generated bigint. Defaults to `0n`.
   * @param args.max Upper bound for generated bigint. Defaults to `min + 999999999999999n`.
   *
   * @throws When `min` is greater than `max`.
   *
   * @example
   * modules.datatype.bigInt() // 55422n
   * modules.datatype.bigInt({ min: 1000000n }) // 431433n
   * modules.datatype.bigInt({ max: 100n }) // 42n
   * modules.datatype.bigInt({ min: 10n, max: 100n }) // 36n
   */
  bigint({ max: imax, min: imin }: BigIntProps = {}): bigint {
    const min = typeof imin === "bigint" ? imin : BigInt(0);
    const max = typeof imax === "bigint" ? imax : min + BigInt(999999999999999);

    if (max === min) {
      return min;
    }

    if (max < min) {
      throw new ChacaError(`Max ${max} should be larger then min ${min}.`);
    }

    const delta = max - min;

    const offset =
      BigInt(
        this.numeric({
          length: delta.toString(10).length,
          allowLeadingZeros: true,
        }),
      ) %
      (delta + BigInt(1));

    return min + offset;
  }

  /**
   * Returns a keyboard special character
   *
   * @example modules.datatype.specialCharacter() // '_'
   *
   * @returns string
   */
  specialCharacter(): string {
    return this.utils.oneOfArray(SPECIAL_CHARACTERS);
  }

  /**
   * Returns a boolean
   *
   * @example modules.datatype.boolean() // true
   *
   * @returns boolean
   */
  boolean(): boolean {
    return this.utils.oneOfArray([true, false]);
  }

  /**
   * Returns a integer number
   *
   * @param args.min Minimun posible value (inclusive)
   * @param args.max Maximun posible value (exclusive)
   *
   * @example
   * modules.datatype.int() // 462
   * modules.datatype.int({ min: 10, max: 30 }) // 28
   *
   * @returns number
   */
  int({ max, min }: IntProps = {}): number {
    let range: number;

    if (typeof max === "number" && typeof min === "number") {
      if (min > max) {
        throw new ChacaError(`Max ${max} should be greater than min ${min}.`);
      }

      range = max - min;
    } else if (typeof max === "number" && typeof min === "undefined") {
      range = max;
    } else if (typeof max === "undefined" && typeof min === "number") {
      range = this.MAX_RANDOM_VALUE - min;
    } else {
      range = this.utils.oneOfArray([
        this.MAX_RANDOM_VALUE,
        this.MIN_RANDOM_VALUE,
      ]);
    }

    const val = Math.floor(this.utils.next() * range + (min || 0));

    return val;
  }

  /**
   * Returns a float number
   *
   * @param args.min Minimun posible value
   * @param args.max Maximun posible value
   * @param args.precision Precision of the float. Must be a value between `1` and `20`
   *
   * @example
   * modules.datatype.float() // 462.12
   * modules.datatype.float({ min: 10, max: 30 }) // 10.23
   * modules.datatype.float({ precision: 4 }) // 90.5362
   *
   * @returns number
   */
  float({ max, min, precision }: FloatProps = {}): number {
    let range: number;

    if (typeof max === "number" && typeof min === "number") {
      if (min > max) {
        throw new ChacaError(`Max ${max} should be greater than min ${min}.`);
      }

      range = max - min;
    } else if (typeof max === "number" && typeof min === "undefined") {
      range = max;
    } else if (typeof max === "undefined" && typeof min === "number") {
      range = this.MAX_RANDOM_VALUE - min;
    } else {
      range = this.utils.oneOfArray([
        this.MAX_RANDOM_VALUE,
        this.MIN_RANDOM_VALUE,
      ]);
    }

    const pres: number =
      typeof precision === "number" &&
      precision > 0 &&
      precision <= this.MAX_PRECISION
        ? precision
        : this.int({ min: 1, max: 10 });

    const randomNum = this.utils.next() * range + (min || 0);
    const factor = Math.pow(10, pres);

    const returnValue = Math.round(randomNum * factor) / factor;

    return returnValue;
  }

  /**
   * Returns a number
   * @param args.min Minimun posible value
   * @param args.max Maximun posible value
   * @param args.precision Precision of the number. Must be a value between `0` and `20`.
   * @example
   * modules.datatype.number() // 301
   * modules.datatype.number({ min: 10, max: 30 }) // 10.2327
   * @returns number
   */
  number({ max, min, precision }: NumberProps = {}): number {
    let val: number;

    const pres =
      typeof precision === "number" && precision >= 0
        ? precision
        : this.int({ min: 0, max: 10 });

    if (pres === 0) {
      val = this.int({ max, min });
    } else {
      val = this.float({ max, min, precision });
    }

    return val;
  }

  /**
   * Returns a string with a hexadecimal code
   *
   * @param args.case Case of the values inside de hexadecimal code (`mixed` | `lower` | `upper`)
   * @param args.length Lenght of the hexadecimal code
   *
   * @example
   * modules.datatype.hexadecimal() // '009df'
   * modules.datatype.hexadecimal({ length: 3 }) // '01D'
   * modules.datatype.hexadecimal({ lenght: 3, case: 'upper' }) // 'DE20'
   * @returns string
   */
  hexadecimal({
    length: ilength,
    case: icase = "mixed",
  }: HexadecimalProps = {}): string {
    const utils = new ChacaUtils();

    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const characters = ["A", "B", "C", "D", "E", "F"];

    const length =
      typeof ilength === "number" && ilength >= 0
        ? ilength
        : this.int({ min: 5, max: 10 });
    const c = icase ? icase : "mixed";

    let ret = "";
    for (let i = 1; i <= length; i++) {
      ret = ret.concat(
        utils.oneOfArray([
          ...numbers,
          ...characters.map((el) => {
            if (c === "lower") {
              return el.toLowerCase();
            } else if (c === "upper") {
              return el;
            } else {
              return utils.oneOfArray([el.toLowerCase(), el.toUpperCase()]);
            }
          }),
        ]),
      );
    }

    return ret;
  }

  /**
   * Return a two dimension matriz of numbers
   *
   * @param args.x_size Columns size
   * @param args.y_size Row size
   * @param args.min Min value for the numbers of the matrix
   * @param args.max Max value for the numbers of the matrix
   * @param args.precision Number precision of the matrix
   *
   * @example
   * modules.datatype.matrix() // [[1, 0, 5], [5, 10, 9]]
   * modules.datatype.matrix({ x_size: 4, y_size: 2 }) // [[1, 2], [0, 0], [1, 1], [4, 5]]
   */
  matrix({
    x_size: ix_size,
    max,
    min,
    precision,
    y_size: iy_size,
  }: MatrixProps = {}): number[][] {
    const x_size =
      typeof ix_size === "number" && ix_size >= 0
        ? ix_size
        : this.int({ min: 1, max: 10 });

    const y_size =
      typeof iy_size === "number" && iy_size >= 0
        ? iy_size
        : this.int({ min: 1, max: 10 });

    return Array.from({ length: x_size }).map(() => {
      return Array.from({ length: y_size }).map(() => {
        return this.number({
          min: min,
          max: max,
          precision: precision,
        });
      });
    });
  }

  /**
   * Returns a character
   *
   * @param args.case Case of the characters (`lower`, `upper` or `mixed`)
   *
   * @example
   * modules.datatype.character() // 'c'
   * modules.datatype.character({ case: 'upper' }) // "H"
   *
   * @returns string
   */
  character({ case: icase = "mixed" }: CharacterProps = {}): string {
    return this.characters({ length: 1, case: icase });
  }

  /**
   * Returns a series of characters
   *
   * @param args.length Length of characters.
   * @param args.case Case of the characters (`lower`, `upper` or `mixed`)
   *
   * @example
   * modules.datatype.characters() // 'v'
   * modules.datatype.characters({ length: 5 }) // 'bhtlw'
   * modules.datatype.characters({ length: 5, case: 'upper' }) // 'HQRSD'
   *
   * @returns string
   */
  characters({ case: icase = "mixed", length }: CharactersProps = {}): string {
    const len =
      typeof length === "number" && length >= 0
        ? length
        : this.int({ min: 5, max: 10 });

    let charactersToRet: string[];

    if (icase) {
      if (icase === "lower") {
        charactersToRet = this.constants.lowerCharacters;
      } else if (icase === "upper") {
        charactersToRet = this.constants.upperCharacters;
      } else {
        charactersToRet = this.constants.mixedCharacters;
      }
    } else {
      charactersToRet = this.constants.mixedCharacters;
    }

    let ret = "";
    for (let i = 1; i <= len; i++) {
      ret = ret.concat(this.utils.oneOfArray(charactersToRet));
    }

    return ret;
  }

  /**
   * Returns a string with a binary code
   * @param args.length Length of the binary code
   * @example
   * modules.datatype.binaryCode() // '00101'
   * modules.datatype.binaryCode({ length: 6 }) // '010100'
   * @returns string
   */
  binaryCode({ length: ilength, prefix = "" }: BinaryCodeProps = {}): string {
    const length =
      typeof ilength === "number" && ilength >= 0 ? ilength : undefined;

    return this.generateByLength(prefix, length, () =>
      String(this.utils.oneOfArray([0, 1])),
    );
  }

  /**
   * @param args.length Length of the string
   * @param args.case Case of the string. (`lower`, `upper`, `mixed`)
   * @param args.banned Characters that cannot appear in the string. It can be an array of characters or a string with all the characters
   * @param args.prefix Prefix for the generated string
   *
   * @example
   * modules.datatype.alphaNumeric() // "F43jUs"
   * modules.datatype.alphaNumeric({ length: 5 }) // "n3jO4"
   * modules.datatype.alphaNumeric({ length: 7, case = "lower" }) // "ow3kn42"
   * @returns string
   */
  alphaNumeric({
    length: ilength,
    case: icase = "mixed",
    banned: ibanned,
    prefix = "",
  }: AlphaNumericProps = {}): string {
    const length =
      typeof ilength === "number" && ilength >= 0 ? ilength : undefined;

    const banned: string[] = [];

    if (ibanned) {
      if (typeof ibanned === "string") {
        for (let i = 0; i < ibanned.length; i++) {
          banned.push(ibanned[i]);
        }
      } else if (Array.isArray(ibanned)) {
        for (const c of ibanned) {
          banned.push(c);
        }
      }
    }

    const selectNumbers = this.constants.numbers.filter(
      (el) => !banned.includes(el),
    );

    const characters = this.filterCharacters(icase);
    const selectCharacters = characters.filter((el) => {
      let is = true;

      banned.forEach((b) => {
        if (b === el) is = false;
      });

      return is;
    });

    const selectValues = [...selectCharacters, ...selectNumbers];

    return this.generateByLength(prefix, length, () =>
      this.utils.oneOfArray(selectValues),
    );
  }

  /**
   * Returns an [octal](https://en.wikipedia.org/wiki/Octal) string.
   *
   * @param args.length The number or range of characters to generate after the prefix.
   * @param args.prefix Prefix for the generated number. Defaults to `'0o'`.
   *
   * @example
   * modules.datatype.octal() // '0o3'
   * modules.datatype.octal({ length: 10 }) // '0o1526216210'
   * modules.datatype.octal({ prefix: '0o' }) // '0o7'
   * modules.datatype.octal({ length: 10, prefix: 'oct_' }) // 'oct_1542153414'
   */
  octal({ length: ilength, prefix = "0o" }: OctalProps = {}): string {
    const length =
      typeof ilength === "number" && ilength >= 0 ? ilength : undefined;

    return this.generateByLength(prefix, length, () => {
      return this.utils.oneOfArray(["0", "1", "2", "3", "4", "5", "6", "7"]);
    });
  }

  /**
   * Generates a given length string of digits.
   *
   * @param args.length The number or range of digits to generate.
   * @param args.allowLeadingZeros Whether leading zeros are allowed or not. Defaults to `true`.
   * @param args.banned An array of digits which should be excluded in the generated string. Defaults to `[]`.
   * @param args.prefix Prefix for the generated string
   *
   * @example
   * modules.datatype.numeric() // '2'
   * modules.datatype.numeric({ length: 42, allowLeadingZeros: false }) // '72564846278453876543517840713421451546115'
   * modules.datatype.numeric({ length: 6, exclude: ['0'] }) // '943228'
   *
   */
  numeric({
    length: ilength,
    allowLeadingZeros = true,
    prefix = "",
    banned = [],
  }: NumericProps = {}): string {
    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    const length =
      typeof ilength === "number" && ilength >= 0 ? ilength : undefined;

    let firstNotZero = false;
    return this.generateByLength(prefix, length, () => {
      const value = this.utils.oneOfArray(
        numbers
          .filter((n) => {
            if (!firstNotZero && !allowLeadingZeros) {
              return n !== "0";
            }

            return true;
          })
          .filter((n) => !banned.includes(n)),
      );

      if (value !== undefined) {
        if (value !== "0") {
          firstNotZero = true;
        }

        return value;
      } else {
        return "";
      }
    });
  }

  private filterCharacters(fCase?: Case): string[] {
    if (fCase === "upper") {
      return this.constants.upperCharacters;
    } else if (fCase === "lower") {
      return this.constants.lowerCharacters;
    } else {
      return this.constants.mixedCharacters;
    }
  }

  private generateByLength(
    prefix: string,
    length: number | undefined,
    func: () => string,
  ): string {
    let str = prefix;

    if (length !== undefined) {
      for (let i = 0; i < length - prefix.length; i++) {
        str += func();
      }

      return str.slice(0, length);
    } else {
      const min = prefix.length + 4;
      const max = min + 6;

      for (let i = 0; i < this.int({ min: min, max: max }); i++) {
        str += func();
      }
    }

    return str;
  }
}
