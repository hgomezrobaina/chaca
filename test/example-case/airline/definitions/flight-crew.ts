import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { CrewRole } from "../types";

export const FLIGHT_CREW_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  flight_id: chaca.ref("Flight.id", {
    where: ({ refFields, store }) => {
      const assigned = store
        .currentDocuments()
        .filter((d) => d.flight_id === refFields.id);

      return assigned.length < 4;
    },
  }),
  crew_member_id: chaca.ref("CrewMember.id", {
    where: async ({ refFields, currentFields, store }) => {
      const flights = await store.get("Flight");
      const aircrafts = await store.get("Aircraft");
      const crew = await store.get("CrewMember");

      const flight = FindRef.execute({
        documents: flights,
        id: currentFields.flight_id,
        from: "FlightCrew.flight_id",
      });
      const aircraft = FindRef.execute({
        documents: aircrafts,
        id: flight.aircraft_id,
        from: "Flight.aircraft_id",
      });

      if (refFields.airline_id !== aircraft.airline_id) {
        return false;
      }

      const assigned = store
        .currentDocuments()
        .filter((d) => d.flight_id === currentFields.flight_id);

      if (assigned.some((d) => d.crew_member_id === refFields.id)) {
        return false;
      }

      if (refFields.role === CrewRole.Pilot) {
        const pilots = assigned.filter((d) => {
          const member = crew.find((c) => c.id === d.crew_member_id);

          return member !== undefined && member.role === CrewRole.Pilot;
        });

        if (pilots.length >= 2) {
          return false;
        }
      }

      return true;
    },
  }),
});
