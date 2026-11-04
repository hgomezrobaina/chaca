import type { ChacaLib } from "../shared/load";
import type { CompetitorLibs } from "./load";

/** Las cuatro librerías que se comparan, compartido por `bench/competitors.ts` y `bench/uniqueness.ts`. */
export enum Library {
  Chaca = "chaca",
  Faker = "faker",
  Chance = "chance",
  Falso = "falso",
}

/**
 * Lo que devuelve una operación medida. Es un tipo real y no `unknown`: cubre
 * todo lo que generan las cuatro librerías en esta lista — cadena, número,
 * booleano, fecha, y el documento o el dataset completo que arman
 * `document-array` y `relational-dataset`.
 */
export type GeneratedValue = string | number | boolean | Date | object;

/** Una llamada medida: síncrona en casi todas, asíncrona en `schema.array()` y en `dataset.generate()`. */
export type OperationCall = () => GeneratedValue | Promise<GeneratedValue>;

export interface CompetitorCalls {
  faker: OperationCall | null;
  chance: OperationCall | null;
  falso: OperationCall | null;
}

export interface Operation {
  /** Clave estable; es la que viaja al snapshot y a la web. */
  key: string;
  /** Lo que se publica como nombre de la operación, en los dos idiomas. */
  label: { en: string; es: string };
  /** `null` cuando Chaca no tiene equivalente. */
  chaca: OperationCall | null;
  competitors: CompetitorCalls;
}

export interface BuildOperationsProps {
  chacaLib: ChacaLib;
  competitors: CompetitorLibs;
}

/**
 * Las 19 operaciones comparadas, declaradas como dato — cada una dice su
 * método en las cuatro librerías, o `null` cuando una de ellas no tiene
 * equivalente. `test/bench/competitor-operations.test.ts` falla si alguna
 * fila se queda sin esa decisión, igual que `build-matrix.ts` del informe de
 * competencia fallaba si un método quedaba sin veredicto.
 *
 * Los nombres de métodos están leídos de los paquetes el 2026-11-04, no de su
 * documentación: `@faker-js/faker@10.6.0`, `chance@1.1.13` y
 * `@ngneat/falso@8.0.2` (design.md § «Las operaciones comparadas»).
 */
export function buildOperations({
  chacaLib,
  competitors,
}: BuildOperationsProps): Operation[] {
  const { modules } = chacaLib;
  const { faker, chance, falso } = competitors;

  return [
    {
      key: "uuid",
      label: { en: "UUID", es: "UUID" },
      chaca: () => {
        return modules.id.uuid();
      },
      competitors: {
        faker: () => {
          return faker.string.uuid();
        },
        chance: () => {
          return chance.guid();
        },
        falso: () => {
          return falso.randUuid();
        },
      },
    },
    {
      key: "full-name",
      label: { en: "Full name", es: "Nombre completo" },
      chaca: () => {
        return modules.person.fullName();
      },
      competitors: {
        faker: () => {
          return faker.person.fullName();
        },
        chance: () => {
          return chance.name();
        },
        falso: () => {
          return falso.randFullName();
        },
      },
    },
    {
      key: "first-name",
      label: { en: "First name", es: "Nombre" },
      chaca: () => {
        return modules.person.firstName();
      },
      competitors: {
        faker: () => {
          return faker.person.firstName();
        },
        chance: () => {
          return chance.first();
        },
        falso: () => {
          return falso.randFirstName();
        },
      },
    },
    {
      key: "email",
      label: { en: "Email", es: "Correo" },
      chaca: () => {
        return modules.internet.email();
      },
      competitors: {
        faker: () => {
          return faker.internet.email();
        },
        chance: () => {
          return chance.email();
        },
        falso: () => {
          return falso.randEmail();
        },
      },
    },
    {
      key: "url",
      label: { en: "URL", es: "URL" },
      chaca: () => {
        return modules.internet.url();
      },
      competitors: {
        faker: () => {
          return faker.internet.url();
        },
        chance: () => {
          return chance.url();
        },
        falso: () => {
          return falso.randUrl();
        },
      },
    },
    {
      key: "ip",
      label: { en: "IP address", es: "Dirección IP" },
      chaca: () => {
        return modules.internet.ip();
      },
      competitors: {
        faker: () => {
          return faker.internet.ip();
        },
        chance: () => {
          return chance.ip();
        },
        falso: () => {
          return falso.randIp();
        },
      },
    },
    {
      key: "int-range",
      label: { en: "Integer in range", es: "Entero en un rango" },
      chaca: () => {
        return modules.datatype.int({ min: 0, max: 500000 });
      },
      competitors: {
        faker: () => {
          return faker.number.int({ min: 0, max: 500000 });
        },
        chance: () => {
          return chance.integer({ min: 0, max: 500000 });
        },
        falso: () => {
          return falso.randNumber({ min: 0, max: 500000 });
        },
      },
    },
    {
      key: "float",
      label: { en: "Float", es: "Decimal" },
      chaca: () => {
        return modules.datatype.float();
      },
      competitors: {
        faker: () => {
          return faker.number.float();
        },
        chance: () => {
          return chance.floating();
        },
        falso: () => {
          return falso.randFloat();
        },
      },
    },
    {
      key: "boolean",
      label: { en: "Boolean", es: "Booleano" },
      chaca: () => {
        return modules.datatype.boolean();
      },
      competitors: {
        faker: () => {
          return faker.datatype.boolean();
        },
        chance: () => {
          return chance.bool();
        },
        falso: () => {
          return falso.randBoolean();
        },
      },
    },
    {
      key: "hexadecimal",
      label: { en: "Hexadecimal", es: "Hexadecimal" },
      chaca: () => {
        return modules.datatype.hexadecimal();
      },
      competitors: {
        faker: () => {
          return faker.string.hexadecimal();
        },
        chance: () => {
          return chance.hex();
        },
        falso: () => {
          return falso.randHexaDecimal();
        },
      },
    },
    {
      key: "alphanumeric",
      label: { en: "Alphanumeric", es: "Alfanumérico" },
      chaca: () => {
        return modules.datatype.alphaNumeric();
      },
      competitors: {
        faker: () => {
          return faker.string.alphanumeric();
        },
        // chance.string() usa otro alfabeto (incluye símbolos por defecto): no
        // es la misma unidad de trabajo, así que no tiene equivalente aquí.
        chance: null,
        falso: () => {
          return falso.randAlphaNumeric();
        },
      },
    },
    {
      key: "word",
      label: { en: "Word", es: "Palabra" },
      chaca: () => {
        return modules.lorem.word();
      },
      competitors: {
        faker: () => {
          return faker.lorem.word();
        },
        chance: () => {
          return chance.word();
        },
        falso: () => {
          return falso.randWord();
        },
      },
    },
    {
      key: "sentence",
      label: { en: "Sentence", es: "Frase" },
      chaca: () => {
        return modules.lorem.sentence();
      },
      competitors: {
        faker: () => {
          return faker.lorem.sentence();
        },
        chance: () => {
          return chance.sentence();
        },
        falso: () => {
          return falso.randSentence();
        },
      },
    },
    {
      key: "country",
      label: { en: "Country", es: "País" },
      chaca: () => {
        return modules.address.country();
      },
      competitors: {
        faker: () => {
          return faker.location.country();
        },
        chance: () => {
          return chance.country();
        },
        falso: () => {
          return falso.randCountry();
        },
      },
    },
    {
      key: "zip-code",
      label: { en: "Zip code", es: "Código postal" },
      chaca: () => {
        return modules.address.zipCode();
      },
      competitors: {
        faker: () => {
          return faker.location.zipCode();
        },
        chance: () => {
          return chance.zip();
        },
        falso: () => {
          return falso.randZipCode();
        },
      },
    },
    {
      key: "city",
      label: { en: "City", es: "Ciudad" },
      // Chaca no tiene ciudad (es la primera columna de `address-street-data`,
      // el candidato que los ocho competidores del informe cubren y ella no).
      chaca: null,
      competitors: {
        faker: () => {
          return faker.location.city();
        },
        chance: () => {
          return chance.city();
        },
        falso: () => {
          return falso.randCity();
        },
      },
    },
    {
      key: "past-date",
      label: { en: "Past date", es: "Fecha pasada" },
      chaca: () => {
        return modules.date.past();
      },
      competitors: {
        faker: () => {
          return faker.date.past();
        },
        // chance.date() no acota al pasado: no es la misma unidad de trabajo.
        chance: null,
        falso: () => {
          return falso.randPastDate();
        },
      },
    },
  ];
}

/** Tamaños del barrido de `document-array`, el mismo de `bench/shared/schemas.ts:SIZES`. */
export const DOCUMENT_ARRAY_SIZES = [100, 1000, 10000] as const;

/** El documento de cuatro campos de `SIMPLE_SCHEMA` (`bench/shared/schemas.ts:8-13`). */
export interface GeneratedDocument {
  id: string;
  name: string;
  likes: number;
  category: string;
}

export interface DocumentArrayCalls {
  chaca: (count: number) => Promise<GeneratedDocument[]>;
  faker: (count: number) => GeneratedDocument[];
  chance: (count: number) => GeneratedDocument[];
  falso: (count: number) => GeneratedDocument[];
}

/**
 * `document-array`: el mismo documento de cuatro campos que mide
 * `generation.bench.ts` (`SIMPLE_SCHEMA`), repetido n veces. Chaca lo hace con
 * `schema.array(n)`; los tres competidores no tienen el concepto de schema,
 * así que su lado es el bucle más directo que arma el mismo objeto — la misma
 * unidad de trabajo con otra API (regla 6 de los requisitos).
 */
export function buildDocumentArrayCalls({
  chacaLib,
  competitors,
}: BuildOperationsProps): DocumentArrayCalls {
  const { chaca, modules } = chacaLib;
  const { faker, chance, falso } = competitors;

  const CATEGORIES = ["Horror", "War", "History", "Comedy"];

  const SCHEMA = chaca.schema({
    id: chaca.key(() => {
      return modules.id.uuid();
    }),
    name: () => {
      return modules.person.fullName();
    },
    likes: () => {
      return modules.datatype.int({ min: 0, max: 500000 });
    },
    category: chaca.enum(CATEGORIES),
  });

  function fakerDocuments(count: number): GeneratedDocument[] {
    const documents = [];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        likes: faker.number.int({ min: 0, max: 500000 }),
        category: faker.helpers.arrayElement(CATEGORIES),
      });
    }

    return documents;
  }

  function chanceDocuments(count: number): GeneratedDocument[] {
    const documents = [];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: chance.guid(),
        name: chance.name(),
        likes: chance.integer({ min: 0, max: 500000 }),
        category: chance.pickone(CATEGORIES),
      });
    }

    return documents;
  }

  function falsoDocuments(count: number): GeneratedDocument[] {
    const documents = [];

    for (let i = 0; i < count; i++) {
      documents.push({
        id: falso.randUuid(),
        name: falso.randFullName(),
        likes: falso.randNumber({ min: 0, max: 500000 }),
        category: falso.rand(CATEGORIES),
      });
    }

    return documents;
  }

  return {
    chaca: (count) => {
      return SCHEMA.array(count);
    },
    faker: (count) => {
      return fakerDocuments(count);
    },
    chance: (count) => {
      return chanceDocuments(count);
    },
    falso: (count) => {
      return falsoDocuments(count);
    },
  };
}

/**
 * `relational-dataset`: sin equivalente en ninguno de los tres competidores.
 * Reutiliza el mismo dataset de tres schemas de `bench/shared/datasets.ts`, a
 * la escala más pequeña (35 documentos), que es la que se publica como
 * capacidad propia y no como victoria de velocidad (design.md § «Dos filas
 * necesitan explicación»).
 */
export interface RelationalDatasetCall {
  chaca: () => Promise<Record<string, object[]>>;
}

export function buildRelationalDatasetCall({
  chacaLib,
}: BuildOperationsProps): RelationalDatasetCall {
  return {
    chaca: async () => {
      const { relationalDataset } = await import("../shared/datasets");

      return relationalDataset({ chacaLib, scale: 1 }).generate();
    },
  };
}
