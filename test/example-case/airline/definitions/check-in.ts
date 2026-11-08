import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { BookingStatus } from "../types";

const SEAT_LETTERS = "ABCDEF";

export const CHECK_IN_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  booking_id: chaca.ref("Booking.id", {
    unique: true,
    where: ({ refFields }) => {
      return refFields.status === BookingStatus.CheckedIn;
    },
  }),
  seat: async ({ currentFields, store }) => {
    const bookings = await store.get("Booking");
    const booking = FindRef.execute({
      documents: bookings,
      id: currentFields.booking_id,
      from: "CheckIn.booking_id",
    });

    const index = store.currentDocuments().filter((c) => {
      if (c.id === currentFields.id) {
        return false;
      }

      const other = FindRef.execute({
        documents: bookings,
        id: c.booking_id,
        from: "CheckIn.booking_id",
      });

      return other.flight_id === booking.flight_id;
    }).length;

    const row = Math.floor(index / SEAT_LETTERS.length) + 1;
    const letter = SEAT_LETTERS[index % SEAT_LETTERS.length];

    return `${row}${letter}`;
  },
  checkin_date: async ({ currentFields, store }) => {
    const bookings = await store.get("Booking");
    const flights = await store.get("Flight");

    const booking = FindRef.execute({
      documents: bookings,
      id: currentFields.booking_id,
      from: "CheckIn.booking_id",
    });
    const flight = FindRef.execute({
      documents: flights,
      id: booking.flight_id,
      from: "Booking.flight_id",
    });

    const to = new Date(Math.min(flight.departure.getTime(), Date.now()));

    return modules.date.between({ from: booking.booking_date, to });
  },
});
