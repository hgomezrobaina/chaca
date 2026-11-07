import { describe, expect, it } from "vitest";
import { loadChaca } from "../../bench/shared/load";
import { loadCompetitors } from "../../bench/competitors/load";
import {
  buildDocumentArrayCalls,
  buildOperations,
  buildRelationalDatasetCall,
  type Operation,
} from "../../bench/competitors/operations";

/**
 * Que ninguna operación se quede sin declarar las cuatro librerías, igual que
 * `build-matrix.ts` del informe de competencia fallaba si un método quedaba
 * sin veredicto (design.md § «Las operaciones comparadas»).
 */
describe("competitor operations", () => {
  async function build(): Promise<Operation[]> {
    const chacaLib = await loadChaca();
    const competitors = await loadCompetitors();

    return buildOperations({ chacaLib, competitors });
  }

  it("has the 17 scalar operations of design.md, none repeated", async () => {
    const operations = await build();

    expect(operations).toHaveLength(17);

    const keys = operations.map((operation) => {
      return operation.key;
    });
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every operation a label in both languages", async () => {
    const operations = await build();

    for (const operation of operations) {
      expect(operation.label.en.trim(), operation.key).not.toBe("");
      expect(operation.label.es.trim(), operation.key).not.toBe("");
    }
  });

  it("declares faker, chance and falso for every operation, each a function or an explicit null", async () => {
    const operations = await build();

    for (const operation of operations) {
      for (const library of ["faker", "chance", "falso"] as const) {
        const call = operation.competitors[library];
        const isFunctionOrNull = call === null || typeof call === "function";

        expect(isFunctionOrNull, `${operation.key}.${library}`).toBe(true);
      }
    }
  });

  it("only 'city' has no chaca equivalent, and it keeps real competitor data to show", async () => {
    const operations = await build();

    const withoutChaca = operations.filter((operation) => {
      return operation.chaca === null;
    });
    const withoutChacaKeys = withoutChaca.map((operation) => {
      return operation.key;
    });
    expect(withoutChacaKeys).toEqual(["city"]);

    for (const operation of withoutChaca) {
      const values = Object.values(operation.competitors);
      const hasRealData = values.some((call) => {
        return call !== null;
      });

      expect(hasRealData, operation.key).toBe(true);
    }
  });

  it("only 'alphanumeric' and 'past-date' are missing a chance equivalent", async () => {
    const operations = await build();

    const withoutChance = operations
      .filter((operation) => {
        return operation.competitors.chance === null;
      })
      .map((operation) => {
        return operation.key;
      });

    expect(withoutChance.sort()).toEqual(["alphanumeric", "past-date"]);
  });

  it("every declared call actually runs and returns a value", async () => {
    const operations = await build();

    for (const operation of operations) {
      const calls = [
        operation.chaca,
        operation.competitors.faker,
        operation.competitors.chance,
        operation.competitors.falso,
      ];

      for (const call of calls) {
        if (call === null) {
          continue;
        }

        const value = await call();
        expect(value, operation.key).not.toBeUndefined();
      }
    }
  });

  it("builds the document-array calls for the four libraries", async () => {
    const chacaLib = await loadChaca();
    const competitors = await loadCompetitors();
    const documentArray = buildDocumentArrayCalls({ chacaLib, competitors });

    const chacaDocuments = await documentArray.chaca(3);
    expect(chacaDocuments).toHaveLength(3);

    for (const library of ["faker", "chance", "falso"] as const) {
      const documents = documentArray[library](3);
      expect(documents).toHaveLength(3);
    }
  });

  it("has no competitor equivalent for the relational dataset", async () => {
    const chacaLib = await loadChaca();
    const competitors = await loadCompetitors();
    const relationalDataset = buildRelationalDatasetCall({
      chacaLib,
      competitors,
    });

    const result = await relationalDataset.chaca();
    expect(Object.keys(result).sort()).toEqual([
      "Client",
      "Order",
      "Product",
      "User",
    ]);
  });
});
