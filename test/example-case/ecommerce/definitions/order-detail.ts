import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";

export const ORDER_DETAIL_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  order_id: chaca.ref("Order.id"),
  product_id: chaca.ref("Product.id", {
    where: async ({ currentFields, store, refFields }) => {
      const orders = await store.get("Order");
      const order = FindRef.execute({
        documents: orders,
        id: currentFields.order_id,
        from: "OrderDetail.order_id",
      });

      const all = store
        .currentDocuments()
        .filter((o) => o.order_id === currentFields.order_id);

      return (
        order.order_date > refFields.created_at &&
        !all.some((o) => o.product_id === refFields.id)
      );
    },
  }),
  count: () => modules.datatype.int({ min: 1, max: 10 }),
  unit_price: async ({ currentFields, store }) => {
    const products = await store.get("Product");
    const product = FindRef.execute({
      documents: products,
      id: currentFields.product_id,
      from: "OrderDetail.product_id",
    });

    return product.price;
  },
  subtotal: ({ currentFields }) => {
    return currentFields.count * currentFields.unit_price;
  },
});
