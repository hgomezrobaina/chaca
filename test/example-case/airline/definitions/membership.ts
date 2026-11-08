import { chaca, modules } from "../../../../src";
import { MembershipTier } from "../types";

const POINTS_RANGE_BY_TIER: Record<
  MembershipTier,
  { min: number; max: number }
> = {
  [MembershipTier.Bronze]: { min: 0, max: 9999 },
  [MembershipTier.Silver]: { min: 10000, max: 49999 },
  [MembershipTier.Gold]: { min: 50000, max: 99999 },
  [MembershipTier.Platinum]: { min: 100000, max: 500000 },
};

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
  points: ({ currentFields }) => {
    const range = POINTS_RANGE_BY_TIER[currentFields.tier as MembershipTier];

    return modules.datatype.int({ min: range.min, max: range.max });
  },
  since: () => modules.date.past({ years: 10 }),
});
