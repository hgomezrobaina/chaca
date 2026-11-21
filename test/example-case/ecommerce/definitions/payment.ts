import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../types";

export const PAYMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  order_id: chaca.ref("Order.id", {
    unique: true,
    where: ({ refFields }) => {
      return refFields.status !== OrderStatus.Canceled;
    },
  }),
  pay_date: async ({ currentFields, store }) => {
    const orders = await store.get("Order");
    const order = FindRef.execute({
      documents: orders,
      id: currentFields.order_id,
      from: "Payment.order_id",
    });

    return modules.date.between({ from: order.order_date, to: new Date() });
  },
  amount: async ({ store, currentFields }) => {
    const orderDetails = await store.get("OrderDetail");

    return orderDetails
      .filter((detail) => detail.order_id === currentFields.order_id)
      .reduce((total, detail) => total + detail.subtotal, 0);
  },
  payment_method: chaca.enum([
    PaymentMethod.CreditCard,
    PaymentMethod.Transfer,
    PaymentMethod.Paypal,
    PaymentMethod.Crypto,
  ]),
  status: async ({ currentFields, store }) => {
    const orders = await store.get("Order");
    const order = FindRef.execute({
      documents: orders,
      id: currentFields.order_id,
      from: "Payment.order_id",
    });

    if (order.status === OrderStatus.Delivered) {
      return PaymentStatus.Completed;
    }

    return chaca.utils.oneOfArray([PaymentStatus.Pending, PaymentStatus.Fail]);
  },
});
