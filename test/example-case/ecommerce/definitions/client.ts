import { chaca, modules } from "../../../../src";
import { ClientLevel, UserRole } from "../types";

export const CLIENT_SCHEMA = chaca.schema({
  id: chaca.key(
    chaca.ref("User.id", {
      unique: true,
      where: ({ refFields }) => {
        return refFields.role === UserRole.Client;
      },
    }),
  ),
  enterprice: { type: () => modules.word.noun(), possibleNull: 0.6 },
  country: () => modules.address.country(),
  zipCode: () => modules.address.zipCode(),
  level: chaca.probability([
    { value: ClientLevel.Normal, chance: 0.8 },
    { value: ClientLevel.Premium, chance: 0.3 },
    { value: ClientLevel.Vip, chance: 0.1 },
  ]),
});
