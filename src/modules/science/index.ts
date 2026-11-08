import { ChacaUtils } from "../../core/utils";
import { PERIODIC_TABLE_ELEMENTS } from "./constants/periodic-table";
import { UNITS } from "./constants/units";
import { LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";

export type PeriodicTableProps = LanguageProps & {
  type?: "symbol" | "name";
};

export type UnitProps = LanguageProps & {
  type?: "symbol" | "name";
};

export class ScienceModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      units: UNITS,
      periodicTableElements: PERIODIC_TABLE_ELEMENTS,
      unitNames: this.locales.byLanguage((locale) => locale.science.units),
      elementNames: this.locales.byLanguage((locale) => {
        return locale.science.elements;
      }),
    };
  }

  /**
   * Returns a periodic table element. The symbol is universal and does not
   * depend on the locale; the name does.
   * @param args.type Element format. Can be (`'name'` | `'symbol'`). Defaults `'name'`
   * @param args.language Locale to read the name from. Defaults `en`
   *
   * @example
   * modules.science.periodicTableElement() // 'Curium'
   * modules.science.periodicTableElement({ type: 'symbol' }) // 'Zn'
   *
   * @returns string
   */
  periodicTableElement({
    type = "name",
    language,
  }: PeriodicTableProps = {}): string {
    const element = this.utils.oneOfArray(this.constants.periodicTableElements);

    if (type === "symbol") {
      return element.symbol;
    }

    const elementNames = this.locales.execute({
      language,
      select: (locale) => locale.science.elements,
    });

    return elementNames[element.symbol] ?? element.name;
  }

  /**
   * Returns a unit of measurement. The symbol is universal and does not
   * depend on the locale; the name does.
   *
   * @param args.type Unit format. Can be (`'name'` | `'symbol'`). Defaults `'name'`
   * @param args.language Locale to read the name from. Defaults `en`
   *
   * @example
   * modules.science.unit() // 'hertz (Hz)'
   * modules.science.unit({ type: 'symbol' }) // 'N'
   * @returns string
   */
  unit({ type = "name", language }: UnitProps = {}): string {
    const unit = this.utils.oneOfArray(this.constants.units);

    if (type === "symbol") {
      return unit.symbol;
    }

    const unitNames = this.locales.execute({
      language,
      select: (locale) => locale.science.units,
    });

    return unitNames[unit.key] ?? unit.unit;
  }
}
