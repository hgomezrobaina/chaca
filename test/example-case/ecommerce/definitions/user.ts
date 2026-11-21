import { chaca, modules } from "../../../../src";
import { UserRole } from "../types";

export const USER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.person.firstName(),
  last_name: () => modules.person.lastName(),
  email: () => modules.internet.email(),
  phone: { type: () => modules.phone.number(), possibleNull: 0.6 },
  role: chaca.probability([
    { value: UserRole.Client, chance: 0.7 },
    { value: UserRole.Employee, chance: 0.3 },
    { chance: 0.1, value: UserRole.Admin },
  ]),
  created_at: () => modules.date.past(),
});
