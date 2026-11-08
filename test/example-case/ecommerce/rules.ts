import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import {
  ClientLevel,
  EcommerceDataset,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  SupportTicketStatus,
  UserRole,
} from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ECOMMERCE_RULES: CaseRule<EcommerceDataset>[] = [
  {
    id: "R1",
    text: "The number of clients equals the number of users with role 'client'",
    fields: ["Client.id", "User.role"],
    check: ({ User, Client }) => {
      const clientUsers = User.filter((user) => {
        return user.role === UserRole.Client;
      });

      expect(Client.length).toBe(clientUsers.length);
    },
  },
  {
    id: "R2",
    text: "Every client's id maps back to a user with role 'client'",
    fields: ["Client.id", "User.id", "User.role"],
    check: ({ User, Client }) => {
      for (const client of Client) {
        const user = FindRef.execute({
          documents: User,
          id: client.id,
          from: "Client.id",
        });

        expect(user.role).toBe(UserRole.Client);
      }
    },
  },
  {
    id: "R3",
    text: "There are more 'normal' clients than 'premium' or 'vip' ones",
    fields: ["Client.level"],
    check: ({ Client }) => {
      const normalCount = Client.filter((client) => {
        return client.level === ClientLevel.Normal;
      }).length;
      const premiumCount = Client.filter((client) => {
        return client.level === ClientLevel.Premium;
      }).length;
      const vipCount = Client.filter((client) => {
        return client.level === ClientLevel.Vip;
      }).length;

      expect(normalCount).toBeGreaterThan(premiumCount);
      expect(normalCount).toBeGreaterThan(vipCount);
    },
  },
  {
    id: "R4",
    text: "The number of employees equals the number of users with role 'employee'",
    fields: ["Employee.id", "User.role"],
    check: ({ User, Employee }) => {
      const employeeUsers = User.filter((user) => {
        return user.role === UserRole.Employee;
      });

      expect(Employee.length).toBe(employeeUsers.length);
    },
  },
  {
    id: "R5",
    text: "Every employee's id maps back to a user with role 'employee'",
    fields: ["Employee.id", "User.id", "User.role"],
    check: ({ User, Employee }) => {
      for (const employee of Employee) {
        const user = FindRef.execute({
          documents: User,
          id: employee.id,
          from: "Employee.id",
        });

        expect(user.role).toBe(UserRole.Employee);
      }
    },
  },
  {
    id: "R6",
    text: "A product's price is always greater than or equal to its cost",
    fields: ["Product.price", "Product.cost"],
    check: ({ Product }) => {
      for (const product of Product) {
        expect(product.price).toBeGreaterThanOrEqual(product.cost);
      }
    },
  },
  {
    id: "R7",
    text: "A product cannot be repeated within the same order",
    fields: ["OrderDetail.order_id", "OrderDetail.product_id"],
    check: ({ OrderDetail }) => {
      for (const detail of OrderDetail) {
        for (const other of OrderDetail) {
          if (other.order_id === detail.order_id && other !== detail) {
            expect(other.product_id).not.toBe(detail.product_id);
          }
        }
      }
    },
  },
  {
    id: "R8",
    text: "An order detail's count is between 1 and 10",
    fields: ["OrderDetail.count"],
    check: ({ OrderDetail }) => {
      for (const detail of OrderDetail) {
        expect(detail.count).toBeGreaterThanOrEqual(1);
        expect(detail.count).toBeLessThanOrEqual(10);
      }
    },
  },
  {
    id: "R9",
    text: "An order detail's unit_price equals the referenced product's price",
    fields: [
      "OrderDetail.unit_price",
      "OrderDetail.product_id",
      "Product.price",
    ],
    check: ({ OrderDetail, Product }) => {
      for (const detail of OrderDetail) {
        const product = FindRef.execute({
          documents: Product,
          id: detail.product_id,
          from: "OrderDetail.product_id",
        });

        expect(detail.unit_price).toBe(product.price);
      }
    },
  },
  {
    id: "R10",
    text: "An order detail's subtotal equals count times unit_price",
    fields: [
      "OrderDetail.subtotal",
      "OrderDetail.count",
      "OrderDetail.unit_price",
    ],
    check: ({ OrderDetail }) => {
      for (const detail of OrderDetail) {
        expect(detail.subtotal).toBe(detail.count * detail.unit_price);
      }
    },
  },
  {
    id: "R11",
    text: "An order detail's referenced product was created before the order's date",
    fields: [
      "OrderDetail.order_id",
      "OrderDetail.product_id",
      "Order.order_date",
      "Product.created_at",
    ],
    check: ({ OrderDetail, Order, Product }) => {
      for (const detail of OrderDetail) {
        const order = FindRef.execute({
          documents: Order,
          id: detail.order_id,
          from: "OrderDetail.order_id",
        });
        const product = FindRef.execute({
          documents: Product,
          id: detail.product_id,
          from: "OrderDetail.product_id",
        });

        expect(order.order_date.getTime()).toBeGreaterThan(
          product.created_at.getTime(),
        );
      }
    },
  },
  {
    id: "R12",
    text: "A delivered order's payment status is always 'completed'",
    fields: ["Payment.order_id", "Payment.status", "Order.status"],
    check: ({ Payment, Order }) => {
      for (const payment of Payment) {
        const order = FindRef.execute({
          documents: Order,
          id: payment.order_id,
          from: "Payment.order_id",
        });

        if (order.status === OrderStatus.Delivered) {
          expect(payment.status).toBe(PaymentStatus.Completed);
        }
      }
    },
  },
  {
    id: "R13",
    text: "A payment's amount equals its referenced order's total",
    fields: ["Payment.amount", "Payment.order_id", "Order.total"],
    check: ({ Payment, Order }) => {
      for (const payment of Payment) {
        const order = FindRef.execute({
          documents: Order,
          id: payment.order_id,
          from: "Payment.order_id",
        });

        expect(payment.amount).toBe(order.total);
      }
    },
  },
  {
    id: "R14",
    text: "A payment's pay_date is on or after its order's order_date",
    fields: ["Payment.pay_date", "Payment.order_id", "Order.order_date"],
    check: ({ Payment, Order }) => {
      for (const payment of Payment) {
        const order = FindRef.execute({
          documents: Order,
          id: payment.order_id,
          from: "Payment.order_id",
        });

        expect(payment.pay_date.getTime()).toBeGreaterThanOrEqual(
          order.order_date.getTime(),
        );
      }
    },
  },
  {
    id: "R15",
    text: "An order has at most one shipment",
    fields: ["Shipment.order_id"],
    check: ({ Shipment }) => {
      for (const shipment of Shipment) {
        const sameOrder = Shipment.filter((candidate) => {
          return candidate.order_id === shipment.order_id;
        });

        expect(sameOrder).toHaveLength(1);
      }
    },
  },
  {
    id: "R16",
    text: "A delivered order's shipment status is always 'delivered'",
    fields: ["Shipment.order_id", "Shipment.status", "Order.status"],
    check: ({ Shipment, Order }) => {
      for (const shipment of Shipment) {
        const order = FindRef.execute({
          documents: Order,
          id: shipment.order_id,
          from: "Shipment.order_id",
        });

        if (order.status === OrderStatus.Delivered) {
          expect(shipment.status).toBe(ShipmentStatus.Delivered);
        }
      }
    },
  },
  {
    id: "R17",
    text: "A shipment's send_date exists only once it left the warehouse, and is after the order's date",
    fields: [
      "Shipment.send_date",
      "Shipment.status",
      "Shipment.order_id",
      "Order.order_date",
    ],
    check: ({ Shipment, Order }) => {
      for (const shipment of Shipment) {
        if (shipment.status === ShipmentStatus.Pending) {
          expect(shipment.send_date).toBeNull();
        } else {
          expect(shipment.send_date).not.toBeNull();

          const order = FindRef.execute({
            documents: Order,
            id: shipment.order_id,
            from: "Shipment.order_id",
          });

          if (shipment.send_date !== null) {
            expect(shipment.send_date.getTime()).toBeGreaterThanOrEqual(
              order.order_date.getTime(),
            );
          }
        }
      }
    },
  },
  {
    id: "R18",
    text: "A shipment's deliver_date exists only for 'delivered' or 'returned' shipments, and is after send_date",
    fields: ["Shipment.deliver_date", "Shipment.status", "Shipment.send_date"],
    check: ({ Shipment }) => {
      for (const shipment of Shipment) {
        if (
          shipment.status === ShipmentStatus.Delivered ||
          shipment.status === ShipmentStatus.Returned
        ) {
          expect(shipment.deliver_date).not.toBeNull();

          if (shipment.deliver_date !== null && shipment.send_date !== null) {
            expect(shipment.deliver_date.getTime()).toBeGreaterThanOrEqual(
              shipment.send_date.getTime(),
            );
          }
        } else {
          expect(shipment.deliver_date).toBeNull();
        }
      }
    },
  },
  {
    id: "R19",
    text: "A support ticket's created_at is on or after its order's order_date",
    fields: [
      "SupportTicket.created_at",
      "SupportTicket.order_id",
      "Order.order_date",
    ],
    check: ({ SupportTicket, Order }) => {
      for (const ticket of SupportTicket) {
        const order = FindRef.execute({
          documents: Order,
          id: ticket.order_id,
          from: "SupportTicket.order_id",
        });

        expect(ticket.created_at.getTime()).toBeGreaterThanOrEqual(
          order.order_date.getTime(),
        );
      }
    },
  },
  {
    id: "R20",
    text: "A support ticket's close_date exists only when closed, and is after created_at",
    fields: [
      "SupportTicket.close_date",
      "SupportTicket.status",
      "SupportTicket.created_at",
    ],
    check: ({ SupportTicket }) => {
      for (const ticket of SupportTicket) {
        if (ticket.status === SupportTicketStatus.Closed) {
          expect(ticket.close_date).not.toBeNull();

          if (ticket.close_date !== null) {
            expect(ticket.close_date.getTime()).toBeGreaterThanOrEqual(
              ticket.created_at.getTime(),
            );
          }
        } else {
          expect(ticket.close_date).toBeNull();
        }
      }
    },
  },
  {
    id: "R21",
    text: "A product category's name is never empty",
    fields: ["ProductCategory.name"],
    check: ({ ProductCategory }) => {
      for (const category of ProductCategory) {
        expect(category.name.length).toBeGreaterThan(0);
      }
    },
  },
  {
    id: "R22",
    text: "A transporter's email has the shape of an email address",
    fields: ["Transporter.email"],
    check: ({ Transporter }) => {
      for (const transporter of Transporter) {
        expect(transporter.email).toMatch(EMAIL_PATTERN);
      }
    },
  },
];
