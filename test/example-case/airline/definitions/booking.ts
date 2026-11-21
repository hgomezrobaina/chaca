import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { BookingStatus, FlightStatus, SeatClass } from "../types";

export const BOOKING_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  seat_class: chaca.probability([
    { value: SeatClass.Economy, chance: 0.8 },
    { value: SeatClass.Business, chance: 0.2 },
  ]),
  flight_id: chaca.ref("Flight.id", {
    where: async ({ refFields, currentFields, store }) => {
      if (refFields.status === FlightStatus.Cancelled) {
        return false;
      }

      const aircrafts = await store.get("Aircraft");
      const aircraft = FindRef.execute({
        documents: aircrafts,
        id: refFields.aircraft_id,
        from: "Flight.aircraft_id",
      });

      const capacity =
        currentFields.seat_class === SeatClass.Business
          ? aircraft.capacity_business
          : aircraft.capacity_economy;

      const sold = store
        .currentDocuments()
        .filter(
          (b) =>
            b.flight_id === refFields.id &&
            b.seat_class === currentFields.seat_class,
        ).length;

      return sold < capacity;
    },
  }),
  passenger_id: chaca.ref("Passenger.id", {
    where: ({ refFields, currentFields, store }) => {
      const exists = store
        .currentDocuments()
        .some(
          (b) =>
            b.flight_id === currentFields.flight_id &&
            b.passenger_id === refFields.id,
        );

      return !exists;
    },
  }),
  price: async ({ currentFields, store }) => {
    const flights = await store.get("Flight");
    const routes = await store.get("Route");

    const flight = FindRef.execute({
      documents: flights,
      id: currentFields.flight_id,
      from: "Booking.flight_id",
    });
    const route = FindRef.execute({
      documents: routes,
      id: flight.route_id,
      from: "Flight.route_id",
    });

    const multiplier =
      currentFields.seat_class === SeatClass.Business ? 2.5 : 1;

    return Math.round(route.distance_km * 0.12 * multiplier * 100) / 100;
  },
  booking_date: async ({ currentFields, store }) => {
    const flights = await store.get("Flight");
    const flight = FindRef.execute({
      documents: flights,
      id: currentFields.flight_id,
      from: "Booking.flight_id",
    });

    const departure = flight.departure.getTime();
    const from = new Date(departure - 120 * 24 * 60 * 60 * 1000);
    const to = new Date(Math.min(departure - 60 * 60 * 1000, Date.now()));

    return modules.date.between({ from, to });
  },
  status: chaca.probability([
    { value: BookingStatus.Confirmed, chance: 0.5 },
    { value: BookingStatus.CheckedIn, chance: 0.35 },
    { value: BookingStatus.Cancelled, chance: 0.15 },
  ]),
});
