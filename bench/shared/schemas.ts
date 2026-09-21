import { chaca, modules } from "./lib";

/**
 * Cuatro campos planos, ningún campo dependiente: el suelo del coste de generar
 * un documento. Lo que mide es el recorrido del `input-tree` y del
 * `result-tree`, no los módulos.
 */
export const SIMPLE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.person.fullName(),
  likes: () => modules.datatype.int({ min: 0, max: 500000 }),
  category: chaca.enum(["Horror", "War", "History", "Comedy"]),
});

/**
 * El mismo tamaño de documento, pero con todo lo que obliga al resolver a
 * trabajar: array de longitud variable, objeto anidado, campo que depende de
 * otro campo del documento, probabilidad y secuencia.
 *
 * La diferencia contra `SIMPLE_SCHEMA` es el precio de las características, no
 * el de generar datos.
 */
export const COMPLEX_SCHEMA = chaca.schema({
  id: chaca.key(chaca.sequence()),
  authors: {
    type: () => modules.person.fullName({ language: "es" }),
    isArray: { min: 1, max: 3 },
  },
  address: {
    type: chaca.schema({
      country: () => modules.address.country(),
      timeZone: () => modules.address.timeZone(),
      zip: () => modules.address.zipCode(),
    }),
  },
  category: chaca.enum(["Horror", "War", "History", "Comedy"]),
  premium: chaca.probability([
    { chance: 0.2, value: true },
    { chance: 0.8, value: false },
  ]),
  adult: ({ currentFields }: { currentFields: { category: string } }) => {
    return (
      currentFields.category === "Horror" || currentFields.category === "War"
    );
  },
});

/** Tamaños del barrido. Con el suelo medido (~150k docs/s) 10k sigue siendo cómodo. */
export const SIZES = [100, 1000, 10000] as const;

/** Documentos que se serializan en el benchmark de export. */
export const EXPORT_DOCUMENTS = 5000;
