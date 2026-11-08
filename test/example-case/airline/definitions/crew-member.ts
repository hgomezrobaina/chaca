import { chaca, modules } from "../../../../src";
import { CrewRole } from "../types";

export const CREW_MEMBER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  airline_id: chaca.ref("Airline.id"),
  name: () => modules.person.fullName(),
  role: chaca.probability([
    { value: CrewRole.Attendant, chance: 0.5 },
    { value: CrewRole.Pilot, chance: 0.3 },
    { value: CrewRole.Copilot, chance: 0.2 },
  ]),
  license_number: {
    type: () => chaca.utils.replaceSymbols("LIC-######"),
    possibleNull: ({ currentFields }) => {
      return currentFields.role === CrewRole.Attendant;
    },
  },
  hired_at: () => modules.date.past({ years: 15 }),
});
