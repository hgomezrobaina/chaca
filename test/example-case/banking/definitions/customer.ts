import { chaca, modules } from "../../../../src";
import { KycStatus } from "../types";

export const CUSTOMER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  document_number: chaca.sequence({ startsWith: 10000000 }),
  name: () => modules.person.firstName(),
  lastname: () => modules.person.lastName(),
  email: () => modules.internet.email(),
  birthdate: () => modules.date.birthdate({ mode: "age", min: 18 }),
  country: () => modules.address.country(),
  kyc_status: chaca.probability([
    { value: KycStatus.Verified, chance: 0.7 },
    { value: KycStatus.Pending, chance: 0.2 },
    { value: KycStatus.Rejected, chance: 0.1 },
  ]),
  created_at: () => modules.date.past({ years: 5 }),
});
