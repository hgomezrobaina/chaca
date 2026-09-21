import { bench, describe } from "vitest";
import { keep, modules } from "./shared/lib";

/**
 * Una sola llamada a un módulo tarda menos que el propio temporizador, así que
 * se miden mil de golpe. La cifra de la gráfica es "mil valores", no uno.
 */
const CALLS = 1000;

function times(fn: () => unknown) {
  return () => {
    let last: unknown;

    for (let i = 0; i < CALLS; i++) {
      last = fn();
    }

    keep(last);
  };
}

describe("modules · identificadores", () => {
  bench(
    "id.uuid",
    times(() => modules.id.uuid()),
  );
  bench(
    "id.cuid",
    times(() => modules.id.cuid()),
  );
  bench(
    "id.nanoid",
    times(() => modules.id.nanoid()),
  );
  bench(
    "id.ulid",
    times(() => modules.id.ulid()),
  );
  bench(
    "id.mongodbId",
    times(() => modules.id.mongodbId()),
  );
});

describe("modules · texto", () => {
  bench(
    "person.fullName",
    times(() => modules.person.fullName()),
  );
  bench(
    "person.firstName",
    times(() => modules.person.firstName()),
  );
  bench(
    "internet.email",
    times(() => modules.internet.email()),
  );
  bench(
    "word.noun",
    times(() => modules.word.noun()),
  );
  bench(
    "lorem.paragraph",
    times(() => modules.lorem.paragraph()),
  );
});

describe("modules · valores compuestos", () => {
  bench(
    "image.film",
    times(() => modules.image.film()),
  );
  bench(
    "address.country",
    times(() => modules.address.country()),
  );
  bench(
    "date.past",
    times(() => modules.date.past()),
  );
  bench(
    "finance.creditCard",
    times(() => modules.finance.creditCard()),
  );
  bench(
    "datatype.int",
    times(() => modules.datatype.int({ min: 0, max: 500000 })),
  );
});
