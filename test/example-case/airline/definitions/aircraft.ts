import { chaca, modules } from "../../../../src";
import { AircraftModel, AircraftStatus } from "../types";

export const AIRCRAFT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  airline_id: chaca.ref("Airline.id"),
  model: chaca.enum([
    AircraftModel.Atr42,
    AircraftModel.Atr72,
    AircraftModel.Crj900,
    AircraftModel.E175,
    AircraftModel.Dash8,
  ]),
  capacity_economy: () => modules.datatype.int({ min: 6, max: 12 }),
  capacity_business: () => modules.datatype.int({ min: 2, max: 4 }),
  status: chaca.probability([
    { value: AircraftStatus.Active, chance: 0.8 },
    { value: AircraftStatus.Maintenance, chance: 0.15 },
    { value: AircraftStatus.Retired, chance: 0.05 },
  ]),
  manufactured_at: () => modules.date.past({ years: 20 }),
});
