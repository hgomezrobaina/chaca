# Ecommerce case

An online store: users buy products, orders are paid, shipped by transporters, and supported through tickets.

## Entities

| Entity            | Documents             | Description                                                     |
| ----------------- | --------------------- | --------------------------------------------------------------- |
| `User`            | 100                   | Base identity. `role` is `client` (70%), `employee` or `admin`. |
| `Client`          | one per client user   | Extension of `User` (shared PK via unique ref).                 |
| `Employee`        | one per employee user | Extension of `User` (shared PK via unique ref).                 |
| `ProductCategory` | 20                    | Product grouping.                                               |
| `Product`         | 300                   | `price` is always ≥ `cost`.                                     |
| `Order`           | 30                    | Belongs to a `Client`; `employee_id` nullable. Has no `total`: see modeling note below. |
| `OrderDetail`     | 80                    | Order line. `unit_price` copied from the product; `subtotal = count × unit_price`. |
| `Payment`         | one per non-canceled order | `amount` is the sum of its order's `OrderDetail.subtotal`s.      |
| `Transporter`     | 30                    | Delivery company.                                               |
| `Shipment`        | one per `send`/`delivered` order | `order_id` unique ref; canceled orders never get one.      |
| `SupportTicket`   | 20                    | Links client, employee and order.                               |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written.

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **`Client`/`Employee` are a 1:1 extension of `User`** (`Client.id`, `Employee.id`, `User.role`): each is a unique ref to `User.id` filtered by role, with a `documents` count computed from the same filter.
2. **Client tiers skew low** (`Client.level`): `normal` always outnumbers `premium` and `vip`.
3. **Product pricing** (`Product.price`, `Product.cost`): `price` is never below `cost`.
4. **Order lines are internally consistent** (`OrderDetail.product_id`, `.count`, `.unit_price`, `.subtotal`, `.order_id`, `Order.order_date`, `Product.created_at`): a product never repeats within the same order; `count` is 1–10; `unit_price` mirrors the product's `price`; `subtotal = count × unit_price`; the product predates the order.
5. **Modeling note — no `Order.total`**: chaca generates a schema's documents before the schemas that reference it, so `Order` is generated before `OrderDetail` and can never sum its own, not-yet-existing lines. `Payment.amount` carries the total instead (rule 7).
6. **`Payment` is a 1:1 extension of non-canceled orders** (`Payment.order_id`, `Order.status`): a unique ref to non-canceled orders, with a matching dynamic `documents` count — every non-canceled order gets exactly one payment, canceled orders get none.
7. **`Payment` follows its order** (`Payment.amount`, `.status`, `.pay_date`): `amount` is the sum of the order's `OrderDetail.subtotal`s; a `delivered` order's payment is always `completed`; `pay_date` is on or after `order_date`.
8. **`Shipment` is a 1:1 extension of shipped orders** (`Shipment.order_id`): a unique ref to orders that are `send` or `delivered`, with a matching dynamic `documents` count — a canceled order never gets one, and no order gets more than one.
9. **`Shipment` follows its order** (`Shipment.status`, `.send_date`, `.deliver_date`): a `delivered` order's shipment is always `delivered`; `send_date` only exists once it left the warehouse, and is after the order date; `deliver_date` only exists for `delivered`/`returned` shipments, and is after `send_date`.
10. **`SupportTicket` dates** (`.created_at`, `.close_date`, `.status`): `created_at` is on or after the order's date; `close_date` only exists once `closed`, and is after `created_at`.
11. **Natural keys read like real ones** (`ProductCategory.name`, `Transporter.email`): a category's name is never empty; a transporter's email has the shape of an email address.
