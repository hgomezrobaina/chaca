import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { AircraftStatus, FlightStatus } from "../types";

export const FLIGHT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  flight_number: chaca.sequence({ startsWith: 100 }),
  route_id: chaca.ref("Route.id"),
  departure: () => {
    const from = new Date();
    from.setMonth(from.getMonth() - 3);

    const to = new Date();
    to.setMonth(to.getMonth() + 2);

    return modules.date.between({ from, to });
  },
  arrival: async ({ currentFields, store }) => {
    const routes = await store.get("Route");
    const route = FindRef.execute({
      documents: routes,
      id: currentFields.route_id,
      from: "Flight.route_id",
    });

    return new Date(
      currentFields.departure.getTime() + route.duration_min * 60 * 1000,
    );
  },
  aircraft_id: chaca.ref("Aircraft.id", {
    where: ({ refFields, currentFields, store }) => {
      if (refFields.status !== AircraftStatus.Active) {
        return false;
      }

      const overlap = store
        .currentDocuments()
        .some(
          (f) =>
            f.aircraft_id === refFields.id &&
            currentFields.departure.getTime() < f.arrival.getTime() &&
            currentFields.arrival.getTime() > f.departure.getTime(),
        );

      return !overlap;
    },
  }),
  gate_id: chaca.ref("Gate.id", {
    nullOnEmpty: true,
    where: async ({ refFields, currentFields, store }) => {
      const routes = await store.get("Route");
      const route = FindRef.execute({
        documents: routes,
        id: currentFields.route_id,
        from: "Flight.route_id",
      });

      return refFields.airport_id === route.origin_airport_id;
    },
  }),
  status: ({ currentFields }) => {
    if (currentFields.departure.getTime() > Date.now()) {
      return chaca.utils.oneOfArray([
        FlightStatus.Scheduled,
        FlightStatus.Boarding,
        FlightStatus.Cancelled,
      ]);
    }

    return chaca.utils.oneOfArray([
      FlightStatus.Departed,
      FlightStatus.Landed,
      FlightStatus.Cancelled,
    ]);
  },
});
