import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { CrewRole, FlightStatus } from "../types";

export const FLIGHT_CAPTAIN_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  flight_id: chaca.ref("Flight.id", {
    unique: true,
    where: ({ refFields }) => {
      return refFields.status !== FlightStatus.Cancelled;
    },
  }),
  crew_member_id: chaca.ref("CrewMember.id", {
    where: async ({ refFields, currentFields, store }) => {
      if (refFields.role !== CrewRole.Pilot) {
        return false;
      }

      const flights = await store.get("Flight");
      const aircrafts = await store.get("Aircraft");

      const flight = FindRef.execute({
        documents: flights,
        id: currentFields.flight_id,
        from: "FlightCaptain.flight_id",
      });
      const aircraft = FindRef.execute({
        documents: aircrafts,
        id: flight.aircraft_id,
        from: "Flight.aircraft_id",
      });

      return refFields.airline_id === aircraft.airline_id;
    },
  }),
});
