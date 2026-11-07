import { ChacaError } from "../../errors";
import { DatatypeModule } from "../../modules/datatype";
import {
  LOWER_CHARACTERS,
  MIXED_CHARACTERS,
  UPPER_CHARACTERS,
} from "../../modules/datatype/constants/characters";
import { Case } from "change-case-all";

export type TimeUnits =
  "years" | "seconds" | "minutes" | "days" | "hours" | "months";

export type SumDateRangeProps = {
  date: Date;
  value: number;
  range: TimeUnits;
};

export interface PickProps<T> {
  values: T[];
  count: number;
}

export interface MultipleProps<T = any> {
  count: number;
  generator(index: number): T;
}

export interface ReplaceSymbolsProps {
  symbols?: Record<string, string[]>;
  banned?: string[];
}

export class ChacaUtils {
  private readonly datatypeModule = new DatatypeModule(this);

  /**
   * Returns a pseudo-random number in the interval `[0, 1)`.
   *
   * Every random value in chaca comes from here. It is the single point a future
   * seed will replace, so no other place in the library may call `Math.random()`.
   *
   * @example
   * chaca.utils.next() // 0.6137
   *
   * @returns number
   */
  next(): number {
    return Math.random();
  }

  /**
   * Returns one element from an array
   *
   * @param list Array of values to return
   * @example
   * chaca.utils.oneOfArray([1, 2, 3, 5, 4]) // 3
   * chaca.utils.oneOfArray(['Hi!!!', 'Chaca the best!!!', 10]) // 'Chaca the best!!!'
   * chaca.utils.oneOfArray([]) // undefined
   */
  oneOfArray<T>(list: ReadonlyArray<T>) {
    return list[Math.floor(this.next() * list.length)];
  }

  /**
   * Parses the given string symbol by symbols and replaces the placeholder appropriately.
   *
   * - `#` will be replaced with a digit (`0` - `9`).
   * - `?` will be replaced with an upper letter ('A' - 'Z')
   * - `$` will be replaced with a lower letter ('a' - 'z')
   * - `*` will be replaced with either a digit or letter.
   *
   * @param text The template string to parse.
   * @param props.banned values that cannot appear in the string
   * @param props.symbols object with your own symbol definitions
   *
   * @example
   * chaca.utils.replaceSymbols('#####') // '98441'
   * chaca.utils.replaceSymbols('?????') // 'ZYRQQ'
   * chaca.utils.replaceSymbols('***$$') // '4Z3pa'
   * chaca.utils.replaceSymbols('Your pin is: #?*#?*') // 'Your pin is: 0T85L1'
   * chaca.utils.replaceSymbols('#####', { banned: ["3", "7", "8"] }) // '91220'
   *
   * @returns string
   */
  replaceSymbols(
    text: string,
    { banned, symbols: ownSymbols }: ReplaceSymbolsProps = {
      banned: [],
      symbols: {},
    },
  ): string {
    let ret = "";

    const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    const symbols: Record<string, string[]> = {
      "#": numbers,
      "?": UPPER_CHARACTERS,
      $: LOWER_CHARACTERS,
      "*": [...numbers, ...MIXED_CHARACTERS],
      ...ownSymbols,
    };

    for (let i = 0; i < text.length; i++) {
      let val: string = text[i];

      for (const [key, values] of Object.entries(symbols)) {
        if (text[i] === key) {
          const options = values.filter((v) => {
            if (banned) {
              return !banned.includes(v);
            }

            return true;
          });

          if (options.length === 0) {
            throw new ChacaError(
              `For symbol '${key}' there are no values to choose`,
            );
          }

          val = this.oneOfArray(options);

          break;
        }
      }

      ret += val;
    }

    return ret;
  }

  /**
   * Convert a string to camel case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.camelCase('Hello World') // 'helloWorld'
   * chaca.utils.camelCase('hiFriend') // 'hiFriend'
   *
   * @returns string
   */
  camelCase(text: string): string {
    return Case.camel(text);
  }

  /**
   * Convert a string to snake case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.snakeCase('Hello World') // 'hello_world'
   * chaca.utils.snakeCase('hiFriend') // 'hi_friend'
   *
   * @returns string
   */
  snakeCase(text: string): string {
    return Case.snake(text);
  }

  /**
   * Convert a string to dot case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.dotCase('Hello World') // 'hello.world'
   * chaca.utils.dotCase('hiFriend') // 'hi.friend'
   *
   * @returns string
   */
  dotCase(text: string): string {
    return Case.dot(text);
  }

  /**
   * Convert a string to sentence case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.sentenceCase('Hello World') // 'Hello world'
   * chaca.utils.sentenceCase('hiFriend') // 'Hi friend'
   *
   * @returns string
   */
  sentenceCase(text: string): string {
    return Case.sentence(text);
  }

  /**
   * Convert a string to capital case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.capitalCase('Hello World') // 'Hello World'
   * chaca.utils.capitalCase('hiFriend') // 'Hi Friend'
   *
   * @returns string
   */
  capitalCase(text: string): string {
    return Case.capital(text);
  }

  /**
   * Convert a string to pascal case
   *
   * @param text string to transform
   *
   * @example
   * chaca.utils.pascalCase('Hello World') // 'HelloWorld'
   * chaca.utils.pascalCase('hiFriend') // 'HiFriend'
   *
   * @returns string
   */
  pascalCase(text: string): string {
    return Case.pascal(text);
  }

  /**
   * Sum a range value to a date
   *
   * @param param.date Date to modify
   * @param param.range Time unit (`"years"` | `"seconds"` | `"minutes"` | `"days"`| `"hours"` | `"months"`)
   * @param param.value Amount of time unit
   *
   * @returns string
   */
  sumDateRange({ date, range, value }: SumDateRangeProps): Date {
    switch (range) {
      case "years":
        date.setFullYear(date.getFullYear() + value);
        break;
      case "months":
        date.setMonth(date.getMonth() + value);
        break;
      case "days":
        date.setDate(date.getDate() + value);
        break;
      case "hours":
        date.setHours(date.getHours() + value);
        break;
      case "minutes":
        date.setMinutes(date.getMinutes() + value);
        break;
      case "seconds":
        date.setSeconds(date.getSeconds() + value);
        break;
      default:
        throw new ChacaError("Invalid date range");
    }

    return date;
  }

  /**
   * Chooses a series of elements from an array of values, preventing an element from being selected more than once
   *
   * @param args.values Values array
   * @param args.count Number of items to select
   *
   * @example
   * chaca.utils.pick({ values: [1, 2, 3, 4, 5], count: 2 }) // [2, 4]
   * chaca.utils.pick({ values: [1, 2, 3, 4, 5], count: 3 }) // [1, 5, 3]
   */
  pick<T = any>({ values, count }: PickProps<T>): T[] {
    if (count > values.length) {
      throw new ChacaError(
        `The number of elements to select must be less or equal than the array length`,
      );
    }

    if (count === values.length) {
      return [...values];
    } else {
      const generate = (banned: number[]): number => {
        let num = this.datatypeModule.int({
          min: 0,
          max: values.length,
        });

        while (banned.includes(num)) {
          num = this.datatypeModule.int({
            min: 0,
            max: values.length,
          });
        }

        return num;
      };

      const result = [] as T[];
      const banned = [] as number[];

      let i = 0;

      while (i < count) {
        const index = generate(banned);

        banned.push(index);
        result.push(values[index]);

        i++;
      }

      return result;
    }
  }

  /**
   * Generates an array containing values returned by the given method.
   *
   * @param args.count The number of elements to generate.
   *
   * @example
   * chaca.utils.multiple({ generator: () => modules.person.firstName(), count: 3 }) // [ 'Aniya', 'Norval', 'Dallin' ]
   * chaca.utils.multiple({ generator: () => modules.person.firstName(), count: 3 }) // [ 'Santos', 'Lavinia', 'Lavinia' ]
   * chaca.utils.multiple({ generator: (i) => `element-${i}`, count: 3 }) // [ 'element-0', 'element-1', 'element-2' ]
   */
  multiple<T = any>({ generator, count }: MultipleProps<T>): T[] {
    const result = [] as T[];

    for (let i = 0; i < count; i++) {
      const value = generator(i);
      result.push(value);
    }

    return result;
  }
}
