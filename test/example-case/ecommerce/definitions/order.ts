import { chaca, modules } from "../../../../src";
import { OrderStatus } from "../types";

export const ORDER_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  client_id: chaca.ref("Client.id"),
  employee_id: { type: chaca.ref("Employee.id"), possibleNull: 0.6 },
  order_date: () => {
    const from = new Date();
    from.setMonth(from.getMonth() - 6);

    return modules.date.between({ from, to: new Date() });
  },
  status: chaca.enum([
    OrderStatus.Pending,
    OrderStatus.OnProcess,
    OrderStatus.Send,
    OrderStatus.Delivered,
    OrderStatus.Canceled,
  ]),
});
