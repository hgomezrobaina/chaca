import { chaca, modules } from "../../../../src";
import { BloodType } from "../types";

export const PATIENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.person.firstName(),
  lastname: () => modules.person.lastName(),
  birthdate: () => modules.date.birthdate({ mode: "age", min: 0, max: 100 }),
  blood_type: chaca.enum([
    BloodType.APositive,
    BloodType.ANegative,
    BloodType.BPositive,
    BloodType.BNegative,
    BloodType.ABPositive,
    BloodType.ABNegative,
    BloodType.OPositive,
    BloodType.ONegative,
  ]),
  insurance_provider: {
    type: () => modules.word.noun(),
    possibleNull: 0.25,
  },
  email: () => modules.internet.email(),
  phone: () => modules.phone.number(),
});
