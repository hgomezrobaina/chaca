import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

describe("finance modules", () => {
  it("finance.transaction", () => {
    const result = modules.finance.transaction();

    expect(modules.finance.constants.transactionTypes.en).include(result);
  });

  it("finance.subscriptionPlan", () => {
    const result = modules.finance.subscriptionPlan();

    expect(modules.finance.constants.subscriptionPlans.en).include(result);
  });

  it("finance.litecoinAddress", () => {
    const value = modules.finance.litecoinAddress();

    expect(value.length).toBeGreaterThanOrEqual(26);
    expect(value.length).toBeLessThanOrEqual(33);
  });

  describe("finance.pin tests", () => {
    it("no arguments. should return a 4 digit pin", () => {
      const value = modules.finance.pin();

      expect(value).toMatch(/^\d{4}$/);
    });

    it("length = 6. should return a 6 digit pin", () => {
      const value = modules.finance.pin({ length: 6 });

      expect(value).toMatch(/^\d{6}$/);
    });

    it("length = 0. should fall back to a 4 digit pin", () => {
      const value = modules.finance.pin({ length: 0 });

      expect(value).toMatch(/^\d{4}$/);
    });
  });

  describe("finance.amount tests", () => {
    it("no arguments. should start with '$' and have a numeric part", () => {
      const value = modules.finance.amount();

      expect(value.startsWith("$")).toBe(true);
      expect(Number(value.slice(1))).not.toBeNaN();
    });

    it("symbol = '€', min = 10, max = 20, precision = 2. should return a value between 10 and 20", () => {
      for (let i = 0; i < 200; i++) {
        const value = modules.finance.amount({
          symbol: "€",
          min: 10,
          max: 20,
          precision: 2,
        });

        expect(value.startsWith("€")).toBe(true);

        const amount = Number(value.slice(1));

        expect(amount).not.toBeNaN();
        expect(amount).toBeGreaterThanOrEqual(10);
        expect(amount).toBeLessThanOrEqual(20);
      }
    });
  });

  it("finance.bic. should match the ISO-9362 structure with length 8 or 11", () => {
    for (let i = 0; i < 100; i++) {
      const value = modules.finance.bic();

      expect(value).toMatch(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/);
      expect([8, 11]).toContain(value.length);
    }
  });

  it("finance.bitcoinAddress. should start with '1' or '3', have length between 26 and 40 and no banned characters", () => {
    for (let i = 0; i < 100; i++) {
      const value = modules.finance.bitcoinAddress();

      expect(value).toMatch(/^[13]/);
      expect(value.length).toBeGreaterThanOrEqual(26);
      expect(value.length).toBeLessThanOrEqual(40);
      expect(value).not.toMatch(/[0OIl]/);
    }
  });

  it("finance.creditCard", () => {
    const value = modules.finance.creditCard();

    expect(value).toMatch(/^\d{4}-\d{4}-\d{4}-\d{4}$/);
  });

  it("finance.ethereumAddress. should return '0x' + 40 lowercase hex chars", () => {
    const value = modules.finance.ethereumAddress();

    expect(value).toMatch(/^0x[0-9a-f]{40}$/);
    expect(value).toHaveLength(42);
  });

  it("finance.moneyCode", () => {
    const value = modules.finance.moneyCode();

    expect(
      Object.values(modules.finance.constants.moneyInfo).map((el) => el.code),
    ).toContain(value);
  });

  it("finance.moneySymbol", () => {
    const value = modules.finance.moneySymbol();

    expect(
      Object.values(modules.finance.constants.moneyInfo).map((el) => el.symbol),
    ).toContain(value);
  });

  it("finance.currencyMoneyName", () => {
    const value = modules.finance.currencyMoneyName();

    expect(Object.values(modules.finance.constants.currencyNames.en)).toContain(
      value,
    );
  });

  it("finance.creditCardCVV", () => {
    const value = modules.finance.creditCardCVV();

    expect(value).toMatch(/^\d{3}$/);
  });

  it("finance.routingNumber", () => {
    const value = modules.finance.routingNumber();

    expect(value).toMatch(/^\d{9}$/);
  });

  it("finance.accountType", () => {
    const value = modules.finance.accountType();

    expect(modules.finance.constants.accountTypes.en).toContain(value);
  });
});
