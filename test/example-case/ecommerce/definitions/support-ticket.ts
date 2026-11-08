import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { SupportTicketStatus } from "../types";

export const SUPPORT_TICKET_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  client_id: chaca.ref("Client.id"),
  employee_id: chaca.ref("Employee.id"),
  order_id: chaca.ref("Order.id"),
  description: () => modules.lorem.paragraphs(),
  title: () => modules.lorem.sentence(),
  status: chaca.enum([
    SupportTicketStatus.Pending,
    SupportTicketStatus.OnProcess,
    SupportTicketStatus.Closed,
  ]),
  created_at: async ({ currentFields, store }) => {
    const orders = await store.get("Order");
    const order = FindRef.execute({
      documents: orders,
      id: currentFields.order_id,
      from: "SupportTicket.order_id",
    });

    return modules.date.between({ from: order.order_date, to: new Date() });
  },
  close_date: ({ currentFields }) => {
    if (currentFields.status === SupportTicketStatus.Closed) {
      return modules.date.between({
        from: currentFields.created_at,
        to: new Date(),
      });
    }

    return null;
  },
});
