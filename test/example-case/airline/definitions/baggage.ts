import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { SeatClass } from "../types";

export const BAGGAGE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  tag: chaca.sequence({ startsWith: 1000 }),
  checkin_id: chaca.ref("CheckIn.id"),
  weight_kg: async ({ currentFields, store }) => {
    const checkins = await store.get("CheckIn");
    const bookings = await store.get("Booking");

    const checkin = FindRef.execute({
      documents: checkins,
      id: currentFields.checkin_id,
      from: "Baggage.checkin_id",
    });
    const booking = FindRef.execute({
      documents: bookings,
      id: checkin.booking_id,
      from: "CheckIn.booking_id",
    });

    const max = booking.seat_class === SeatClass.Business ? 32 : 23;

    return modules.datatype.float({ precision: 1, min: 5, max });
  },
});
