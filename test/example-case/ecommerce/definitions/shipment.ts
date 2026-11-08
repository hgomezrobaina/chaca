import { chaca, modules } from "../../../../src";
import { OrderStatus, ShipmentStatus } from "../types";

export const SHIPMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  order_id: chaca.ref("Order.id", { unique: true }),
  transporter_id: chaca.ref("Transporter.id"),
  deliver_price: () => {
    return modules.datatype.float({ precision: 2, min: 1, max: 100 });
  },
  status: async ({ store, currentFields }) => {
    const orders = await store.get("Order");
    const found = orders.find((o) => o.id === currentFields.order_id);

    if (found) {
      if (found.status === OrderStatus.Delivered) {
        return ShipmentStatus.Delivered;
      }
    }

    return chaca.utils.oneOfArray([
      ShipmentStatus.Pending,
      ShipmentStatus.InTransit,
      ShipmentStatus.Delivered,
      ShipmentStatus.Returned,
    ]);
  },
  send_date: async ({ currentFields, store }) => {
    if (
      currentFields.status === ShipmentStatus.Delivered ||
      currentFields.status === ShipmentStatus.InTransit ||
      currentFields.status === ShipmentStatus.Returned
    ) {
      const orders = await store.get("Order");
      const found = orders.find((o) => o.id === currentFields.order_id);

      if (found) {
        return modules.date.between({
          from: found.order_date,
          to: new Date(),
        });
      }

      return modules.date.past();
    }

    return null;
  },
  deliver_date: {
    type: ({ currentFields }) => {
      if (
        currentFields.status === ShipmentStatus.Delivered ||
        currentFields.status === ShipmentStatus.Returned
      ) {
        return modules.date.between({
          from: currentFields.send_date,
          to: new Date(),
        });
      }

      return null;
    },
  },
});
