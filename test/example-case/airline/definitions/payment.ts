import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { BookingStatus, PaymentMethod, PaymentStatus } from "../types";

export const PAYMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  booking_id: chaca.ref("Booking.id", { unique: true }),
  amount: async ({ currentFields, store }) => {
    const bookings = await store.get("Booking");
    const booking = FindRef.execute({
      documents: bookings,
      id: currentFields.booking_id,
      from: "Payment.booking_id",
    });

    return booking.price;
  },
  method: chaca.enum([
    PaymentMethod.CreditCard,
    PaymentMethod.Transfer,
    PaymentMethod.Paypal,
  ]),
  status: async ({ currentFields, store }) => {
    const bookings = await store.get("Booking");
    const booking = FindRef.execute({
      documents: bookings,
      id: currentFields.booking_id,
      from: "Payment.booking_id",
    });

    if (booking.status === BookingStatus.Cancelled) {
      return PaymentStatus.Refunded;
    }

    return chaca.utils.oneOfArray([
      PaymentStatus.Completed,
      PaymentStatus.Pending,
    ]);
  },
  created_at: async ({ currentFields, store }) => {
    const bookings = await store.get("Booking");
    const booking = FindRef.execute({
      documents: bookings,
      id: currentFields.booking_id,
      from: "Payment.booking_id",
    });

    return modules.date.between({
      from: booking.booking_date,
      to: new Date(),
    });
  },
});
