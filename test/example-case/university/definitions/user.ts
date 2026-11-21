import { chaca, modules } from "../../../../src";
import { UserRole } from "../types";

export const USER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.person.firstName(),
  lastname: () => modules.person.lastName(),
  email: () => modules.internet.email(),
  phone: () => modules.phone.number(),
  role: chaca.probability([
    { chance: 0.7, value: UserRole.Student },
    { chance: 0.4, value: UserRole.Teacher },
    { chance: 0.1, value: UserRole.Admin },
  ]),
  created_at: () => modules.date.past(),
});
