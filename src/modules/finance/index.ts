import { IBAN, MONEY_INFO } from "./constants";
import { DatatypeModule } from "../datatype";
import { ChacaUtils } from "../../core/utils";
import { LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";

type AmountProps = {
  min?: number;
  max?: number;
  symbol?: string;
  precision?: number;
};

type PinProps = {
  length?: number;
};

export class FinanceModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      ibans: IBAN,
      moneyInfo: MONEY_INFO,
      accountTypes: this.locales.byLanguage((locale) => {
        return locale.finance.accountTypes;
      }),
      transactionTypes: this.locales.byLanguage((locale) => {
        return locale.finance.transactionTypes;
      }),
      subscriptionPlans: this.locales.byLanguage((locale) => {
        return locale.finance.subscriptionPlans;
      }),
      currencyNames: this.locales.byLanguage((locale) => {
        return locale.finance.currencyNames;
      }),
    };
  }

  /**
   * Returns a transaction type from a registered locale.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.finance.transaction() // 'payment'
   *
   * @returns string
   */
  transaction({ language }: LanguageProps = {}): string {
    const transactionTypes = this.locales.execute({
      language,
      select: (locale) => locale.finance.transactionTypes,
    });

    return this.utils.oneOfArray(transactionTypes);
  }

  /**
   * Returns a suscription plan type from a registered locale.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.finance.subscriptionPlan() // 'Free'
   *
   * @returns string
   */
  subscriptionPlan({ language }: LanguageProps = {}): string {
    const subscriptionPlans = this.locales.execute({
      language,
      select: (locale) => locale.finance.subscriptionPlans,
    });

    return this.utils.oneOfArray(subscriptionPlans);
  }

  /**
   * Returns a PIN number.
   *
   * @param args.length The length of the PIN to generate. Defaults to `4`.
   *
   * @example
   * modules.finance.pin() // '5067'
   * modules.finance.pin({ length: 6 }) // '213789'
   *
   * @returns string
   */
  pin({ length }: PinProps = {}): string {
    const len = length && length > 0 ? length : 4;

    return Array.from({ length: len })
      .map(() => String(this.datatypeModule.int({ min: 0, max: 9 })))
      .join("");
  }

  /**
   * Returns a Bitcoin address.
   *
   * @example
   * modules.finance.bitcoinAddress() // '3ySdvCkTLVy7gKD4j6JfSaf5d'
   *
   * @returns string
   */
  bitcoinAddress(): string {
    let address: string = this.utils.oneOfArray(["1", "3"]);

    address += this.datatypeModule.alphaNumeric({
      case: "mixed",
      banned: "0OIl",
      length: this.datatypeModule.int({ min: 25, max: 39 }),
    });

    return address;
  }

  /**
   * Returns a credit card number.
   *
   * @example
   * modules.finance.creditCard() // '6375-3265-4676-6646'
   *
   * @returns string
   */
  creditCard(): string {
    let retString = String(this.datatypeModule.int({ min: 0, max: 9 }));

    for (let i = 1; i < 16; i++) {
      if (i % 4 === 0) retString = retString + "-";

      retString =
        retString + String(this.datatypeModule.int({ min: 0, max: 9 }));
    }

    return retString;
  }

  /**
   * Returns a Ethereum address.
   *
   * @example
   * modules.finance.ethereumAddress() // '0xf03dfeecbafc5147241cc4c4ca20b3c9dfd04c4a'
   *
   * @returns string
   */
  ethereumAddress(): string {
    return `0x${this.datatypeModule.hexadecimal({ length: 40, case: "lower" })}`;
  }

  /**
   * Returns an account type from a registered locale.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example
   * modules.finance.accountType() // "Credit Card"
   *
   * @returns string
   */
  accountType({ language }: LanguageProps = {}): string {
    const accountTypes = this.locales.execute({
      language,
      select: (locale) => locale.finance.accountTypes,
    });

    return this.utils.oneOfArray(accountTypes);
  }

  /**
   * Returns a SWIFT/BIC code based on the [ISO-9362](https://en.wikipedia.org/wiki/ISO_9362) format.
   *
   * @example
   * modules.finance.bic() // 'WYAUPGX1'
   *
   * @returns string
   */
  bic(): string {
    const bankIdentifier = this.datatypeModule.characters({
      length: 4,
      case: "upper",
    });

    const countryCode = this.utils.oneOfArray(IBAN.iso3166);

    const locationCode = this.datatypeModule.alphaNumeric({
      case: "upper",
      length: 2,
    });

    const branchCode = this.datatypeModule.boolean()
      ? this.datatypeModule.boolean()
        ? this.datatypeModule.alphaNumeric({ case: "upper", length: 3 })
        : "XXX"
      : "";

    return `${bankIdentifier}${countryCode}${locationCode}${branchCode}`;
  }

  /**
   * @example
   * modules.finance.routingNumber() // '522814402'
   * @returns string
   */
  routingNumber(): string {
    const routingNumber = this.utils.replaceSymbols("########");

    // Modules 10 straight summation.
    let sum = 0;

    for (let i = 0; i < routingNumber.length; i += 3) {
      sum += Number(routingNumber[i]) * 3;
      sum += Number(routingNumber[i + 1]) * 7;
      sum += Number(routingNumber[i + 2]) || 0;
    }

    return `${routingNumber}${Math.ceil(sum / 10) * 10 - sum}`;
  }

  /**
   * Returns a credit card CVV.
   *
   * @example
   * modules.finance.creditCardCVV() // '506'
   *
   * @returns string
   */
  creditCardCVV(): string {
    let cvv = "";

    for (let i = 0; i < 3; i++) {
      cvv += this.datatypeModule.int({ max: 9, min: 0 }).toString();
    }

    return cvv;
  }

  /**
   * Returns a string with a money symbol
   * @example modules.finance.moneySymbol() // '$'
   * @returns string
   */
  moneySymbol(): string {
    return this.utils.oneOfArray(
      Object.values(MONEY_INFO).map((el) => el.symbol),
    );
  }

  /**
   * Generates a random amount between the given bounds (inclusive).
   *
   * @param args.min The lower bound for the amount.
   * @param args.max The upper bound for the amount.
   * @param args.precision The number of decimal places for the amount.
   * @param args.symbol The symbol used to prefix the amount. Defaults to `'$'`.
   *
   * @example
   * modules.finance.amount()// '$6170.87'
   * modules.finance.amount({ min: 0, max: 1000 }) // '$5.53'
   * modules.finance.amount({ min: 0, max: 1000, symbol: '€', precision: 0 }) // '€5'
   *
   * @returns string
   */
  amount({ max, min, precision, symbol: isymbol }: AmountProps = {}): string {
    const symbol = isymbol ? isymbol : "$";

    return `${symbol}${this.datatypeModule.number({
      max: max,
      min: min,
      precision: precision,
    })}`;
  }

  /**
   * Returns a current money name, named in a registered locale. The rest of
   * the currency's ticket (symbol, decimals, ISO code) is not locale-specific
   * and stays on `constants.moneyInfo`.
   *
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.finance.currencyMoneyName() // 'Us Dollar'
   * @returns string
   */
  currencyMoneyName({ language }: LanguageProps = {}): string {
    const currencyNames = this.locales.execute({
      language,
      select: (locale) => locale.finance.currencyNames,
    });

    return this.utils.oneOfArray(Object.values(currencyNames));
  }

  /**
   * Returns a common money code
   * @example modules.finance.moneyCode() // 'EUR'
   * @returns string
   */
  moneyCode(): string {
    return this.utils.oneOfArray(
      Object.values(MONEY_INFO).map((el) => el.code),
    );
  }

  /**
   * Generates a random Litecoin address.
   *
   * @example
   * modules.finance.litecoinAddress() // 'MoQaSTGWBRXkWfyxKbNKuPrAWGELzcW'
   */
  litecoinAddress(): string {
    const addressLength = this.datatypeModule.int({ min: 26, max: 33 });

    let result = this.utils.oneOfArray(["L", "M", "3"]);

    for (let i = 0; i < addressLength - 1; i++) {
      result += this.utils.oneOfArray(
        "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ".split(""),
      );
    }

    return result;
  }
}
