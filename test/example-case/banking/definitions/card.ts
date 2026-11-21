import Decimal from "decimal.js";
import { chaca, modules } from "../../../../src";
import { AccountType, CardBrand, CardStatus } from "../types";

export const CARD_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  account_id: chaca.ref("Account.id", {
    where: ({ refFields }) => {
      return refFields.type !== AccountType.Savings;
    },
  }),
  pan_last4: () => chaca.utils.replaceSymbols("####"),
  brand: chaca.probability([
    { value: CardBrand.Visa, chance: 0.5 },
    { value: CardBrand.Mastercard, chance: 0.4 },
    { value: CardBrand.Amex, chance: 0.1 },
  ]),
  expires_at: () => modules.date.future({ years: 4 }),
  status: chaca.probability([
    { value: CardStatus.Active, chance: 0.85 },
    { value: CardStatus.Blocked, chance: 0.1 },
    { value: CardStatus.Expired, chance: 0.05 },
  ]),
  daily_limit: () =>
    new Decimal(modules.datatype.float({ precision: 2, min: 100, max: 3000 }))
      .toDecimalPlaces(2)
      .toNumber(),
});
