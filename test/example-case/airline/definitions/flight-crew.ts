import { chaca, modules } from "../../../../src";
import type { DatasetStore } from "../../../../src/core/dataset-store/dataset-store";
import { AirlineCrewMember, AirlineFlightCaptain, CrewRole } from "../types";

/**
 * `where` runs once per candidate (150 flights, then 200 crew members) for
 * every FlightCrew document being generated (350 of them): hundreds of
 * thousands of calls. `Flight`, `Aircraft`, `CrewMember` and `FlightCaptain`
 * never change once FlightCrew starts, so this precomputes, once, the
 * lookups every candidate needs (airline per flight, captain per flight,
 * crew member by id) instead of re-fetching and linearly re-scanning them
 * on every single call. Without it this suite went from ~2s to over a
 * minute.
 */
let staticData: {
  allFlightIds: string[];
  airlineIdByFlight: Map<string, string>;
  captainByFlight: Map<string, AirlineFlightCaptain>;
  crewById: Map<string, AirlineCrewMember>;
} | null = null;

const getStaticData = async (store: DatasetStore) => {
  if (staticData === null) {
    const flights = await store.get("Flight");
    const aircrafts = await store.get("Aircraft");
    const crew = await store.get("CrewMember");
    const captains = await store.get("FlightCaptain");

    const airlineIdByAircraft = new Map(
      aircrafts.map((aircraft) => [aircraft.id, aircraft.airline_id]),
    );
    const airlineIdByFlight = new Map(
      flights.map((flight) => {
        return [flight.id, airlineIdByAircraft.get(flight.aircraft_id)];
      }),
    );

    staticData = {
      allFlightIds: flights.map((flight) => flight.id),
      airlineIdByFlight,
      captainByFlight: new Map(
        captains.map((captain) => [captain.flight_id, captain]),
      ),
      crewById: new Map(crew.map((member) => [member.id, member])),
    };
  }

  return staticData;
};

/**
 * `flight_id`'s assignment counts only change between documents, not
 * between the 150 flight candidates of the same one; recomputing the full
 * map on every candidate added another O(documents x candidates x flights)
 * on top of the fetches above, so it's cached per document count too (reset
 * naturally since it only grows within one `generate()` call).
 */
let cachedCrewCount = -1;
let cachedCounts: Map<string, number> | null = null;

/**
 * `crew_member_id`'s per-document context (the flight's airline, its
 * captain, and who else is already assigned to it) is the same across the
 * 200 crew member candidates of one document; cached per document (flight +
 * how many FlightCrew documents exist so far, since the same flight can
 * recur across non-consecutive documents).
 */
let cachedDocumentKey = "";
let cachedAirlineId: string | undefined;
let cachedCaptain: AirlineFlightCaptain | undefined;
let cachedAssigned: { crew_member_id?: string }[] = [];

export const FLIGHT_CREW_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  flight_id: chaca.ref("Flight.id", {
    where: async ({ refFields, store }) => {
      const crewSoFar = store.currentDocuments();

      if (cachedCounts === null || cachedCrewCount !== crewSoFar.length) {
        const { allFlightIds, captainByFlight } = await getStaticData(store);
        const counts = new Map<string, number>();

        for (const flightId of allFlightIds) {
          counts.set(flightId, 0);
        }

        for (const [flightId] of captainByFlight) {
          counts.set(flightId, (counts.get(flightId) ?? 0) + 1);
        }

        for (const crew of crewSoFar) {
          if (crew.flight_id === undefined) {
            continue;
          }

          counts.set(crew.flight_id, (counts.get(crew.flight_id) ?? 0) + 1);
        }

        cachedCounts = counts;
        cachedCrewCount = crewSoFar.length;
      }

      const counts = cachedCounts;
      const currentCount = counts.get(refFields.id) ?? 0;

      if (currentCount >= 4) {
        return false;
      }

      let minCount = Infinity;

      for (const count of counts.values()) {
        if (count < minCount) {
          minCount = count;
        }
      }

      return currentCount === minCount;
    },
  }),
  crew_member_id: chaca.ref("CrewMember.id", {
    where: async ({ refFields, currentFields, store }) => {
      const { airlineIdByFlight, captainByFlight, crewById } =
        await getStaticData(store);

      const documentKey = `${currentFields.flight_id}:${store.currentDocuments().length}`;

      if (documentKey !== cachedDocumentKey) {
        cachedAirlineId = airlineIdByFlight.get(currentFields.flight_id);
        cachedCaptain = captainByFlight.get(currentFields.flight_id);
        cachedAssigned = store
          .currentDocuments()
          .filter(
            (d) =>
              d.flight_id === currentFields.flight_id &&
              d.crew_member_id !== undefined,
          );
        cachedDocumentKey = documentKey;
      }

      if (refFields.airline_id !== cachedAirlineId) {
        return false;
      }

      if (cachedAssigned.some((d) => d.crew_member_id === refFields.id)) {
        return false;
      }

      if (
        cachedCaptain !== undefined &&
        cachedCaptain.crew_member_id === refFields.id
      ) {
        return false;
      }

      if (refFields.role === CrewRole.Pilot) {
        const pilotsAssigned = cachedAssigned.filter((d) => {
          const member = crewById.get(d.crew_member_id as string);

          return member !== undefined && member.role === CrewRole.Pilot;
        }).length;

        const captainIsPilot = cachedCaptain !== undefined ? 1 : 0;

        if (pilotsAssigned + captainIsPilot >= 2) {
          return false;
        }
      }

      return true;
    },
  }),
});
