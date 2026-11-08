import { DatasetSchema } from "../../../../src";
import { OrderStatus, UserRole } from "../types";
import { CLIENT_SCHEMA } from "./client";
import { EMPLOYEE_SCHEMA } from "./employee";
import { ORDER_SCHEMA } from "./order";
import { ORDER_DETAIL_SCHEMA } from "./order-detail";
import { PAYMENT_SCHEMA } from "./payment";
import { PRODUCT_SCHEMA } from "./product";
import { PRODUCT_CATEGORY_SCHEMA } from "./product-category";
import { SHIPMENT_SCHEMA } from "./shipment";
import { SUPPORT_TICKET_SCHEMA } from "./support-ticket";
import { TRANSPORTER_SCHEMA } from "./transporter";
import { USER_SCHEMA } from "./user";

export const ECOMMERCE_SCHEMAS: DatasetSchema[] = [
  {
    documents: async ({ store }) => {
      const users = await store.get("User");

      return users.filter((u) => u.role === UserRole.Client).length;
    },
    name: "Client",
    schema: CLIENT_SCHEMA,
  },
  {
    documents: async ({ store }) => {
      const users = await store.get("User");

      return users.filter((u) => u.role === UserRole.Employee).length;
    },
    name: "Employee",
    schema: EMPLOYEE_SCHEMA,
  },
  { documents: 80, name: "OrderDetail", schema: ORDER_DETAIL_SCHEMA },
  { documents: 30, name: "Order", schema: ORDER_SCHEMA },
  {
    documents: async ({ store }) => {
      const orders = await store.get("Order");

      return orders.filter((order) => order.status !== OrderStatus.Canceled)
        .length;
    },
    name: "Payment",
    schema: PAYMENT_SCHEMA,
  },
  { documents: 20, name: "ProductCategory", schema: PRODUCT_CATEGORY_SCHEMA },
  { documents: 300, name: "Product", schema: PRODUCT_SCHEMA },
  {
    documents: async ({ store }) => {
      const orders = await store.get("Order");

      return orders.filter((order) => {
        return (
          order.status === OrderStatus.Send ||
          order.status === OrderStatus.Delivered
        );
      }).length;
    },
    name: "Shipment",
    schema: SHIPMENT_SCHEMA,
  },
  { documents: 20, name: "SupportTicket", schema: SUPPORT_TICKET_SCHEMA },
  { documents: 30, name: "Transporter", schema: TRANSPORTER_SCHEMA },
  { documents: 100, name: "User", schema: USER_SCHEMA },
];
