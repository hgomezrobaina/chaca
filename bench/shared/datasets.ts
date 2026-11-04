import type { ChacaLib } from "./load";

export interface RelationalDatasetProps {
  chacaLib: ChacaLib;
  scale: number;
}

/**
 * Un dataset relacional reducido: tres schemas, una referencia simple, una
 * referencia con `where` y un recuento de documentos que depende del store.
 * Son los cuatro caminos caros del `dataset-resolver`.
 *
 * No se reutilizan los `test/example-case/` a propósito: esas definiciones
 * importan `../../../../src` directamente, así que medirlas ignoraría
 * `CHACA_BENCH_TARGET` y `dist` mediría `src` sin avisar.
 *
 * Recibe `chacaLib` ya cargado en vez de importar el singleton de `./lib`
 * (con su `await` de primer nivel): así lo puede llamar tanto un fichero
 * `*.bench.ts` (vitest, ESM) como un script suelto ejecutado por tsx como
 * CommonJS (`bench/competitors.ts`), que un `await` de primer nivel en este
 * módulo rompería (`bench/shared/lib.ts:1-12` explica por qué). (Corrección
 * 2026-11-04: descubierto al cablear `relational-dataset` en la comparativa.)
 */
export function relationalDataset({ chacaLib, scale }: RelationalDatasetProps) {
  const { chaca, modules } = chacaLib;

  const USER = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    name: () => modules.person.firstName(),
    email: () => modules.internet.email(),
    role: chaca.probability([
      { value: "client", chance: 0.7 },
      { value: "employee", chance: 0.3 },
    ]),
    createdAt: () => modules.date.past(),
  });

  const PRODUCT = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    name: () => modules.word.noun(),
    price: () => modules.datatype.float({ precision: 2, min: 1, max: 500 }),
  });

  const ORDER = chaca.schema({
    id: chaca.key(() => modules.id.uuid()),
    // referencia simple
    client_id: chaca.ref("Client.id"),
    // referencia filtrada: obliga al resolver a recorrer los candidatos
    product_id: chaca.ref("Product.id", {
      where: ({ refFields }: { refFields: { price: number } }) => {
        return refFields.price > 10;
      },
    }),
    count: () => modules.datatype.int({ min: 1, max: 10 }),
    subtotal: async ({
      currentFields,
      store,
    }: {
      currentFields: { product_id: string; count: number };
      store: { get: (name: string) => Promise<any[]> };
    }) => {
      const products = await store.get("Product");
      const found = products.find((p) => p.id === currentFields.product_id);

      return found ? found.price * currentFields.count : 0;
    },
  });

  return chaca.dataset<Record<string, object[]>>([
    { documents: 10 * scale, name: "User", schema: USER },
    { documents: 5 * scale, name: "Product", schema: PRODUCT },
    {
      // recuento dependiente del store: no se sabe hasta generar User
      documents: async ({
        store,
      }: {
        store: { get: (n: string) => Promise<any[]> };
      }) => {
        const users = await store.get("User");

        return users.filter((u) => u.role === "client").length;
      },
      name: "Client",
      schema: USER,
    },
    { documents: 20 * scale, name: "Order", schema: ORDER },
  ]);
}

/** Escalas del dataset relacional: 35, 350 y 3500 documentos en total. */
export const DATASET_SCALES = [1, 10, 100] as const;
