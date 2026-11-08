import { chaca, modules } from "../../../../src";
import { MembershipTier } from "../types";

export const MEMBERSHIP_SCHEMA = chaca.schema({
  id: chaca.key(
    chaca.ref("Passenger.id", {
      unique: true,
      where: ({ refFields }) => {
        return refFields.frequent_flyer_number !== null;
      },
    }),
  ),
  tier: chaca.probability([
    { value: MembershipTier.Bronze, chance: 0.6 },
    { value: MembershipTier.Silver, chance: 0.25 },
    { value: MembershipTier.Gold, chance: 0.1 },
    { value: MembershipTier.Platinum, chance: 0.05 },
  ]),
  points: () => modules.datatype.int({ min: 0, max: 100000 }),
  since: () => modules.date.past({ years: 10 }),
});
