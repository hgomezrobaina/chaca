import { describe, expect, it } from "vitest";
import {
  ChacaError,
  Errors,
  FieldGenerationError,
  chaca,
  modules,
} from "../../../src";

describe("Field generation errors", () => {
  describe("custom field / value generation", () => {
    it("the custom function throws an Error. should throw a ValueGenerationError wrapping it, naming the field", async () => {
      const schema = chaca.schema({
        id: () => modules.id.uuid(),
        email: () => {
          throw new Error("boom");
        },
      });

      await expect(schema.object()).rejects.toThrow(
        Errors.ValueGenerationError,
      );
      await expect(schema.object()).rejects.toThrow(ChacaError);

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(FieldGenerationError);

        const err = error as Errors.ValueGenerationError;
        // La ruta incluye el nombre del schema ("Schema" por defecto para un
        // schema suelto sin dataset).
        expect(err.fieldRoute).toBe("Schema.email");
        expect(err.originalError).toBeInstanceOf(Error);
        expect((err.originalError as Error).message).toBe("boom");
        expect(err.cause).toBe(err.originalError);
        expect(err.message).toContain("email");
        expect(err.message).toContain("boom");
      }
    });

    it("the custom function throws a non-Error value. should still be wrapped, with a readable message", async () => {
      const schema = chaca.schema({
        broken: () => {
          throw "just a string";
        },
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.ValueGenerationError);

        const err = error as Errors.ValueGenerationError;
        expect(err.originalError).toBe("just a string");
        expect(err.message).toContain("just a string");
      }
    });

    it("the custom function rejects. should be wrapped the same as a synchronous throw", async () => {
      const schema = chaca.schema({
        broken: () => Promise.reject(new Error("async boom")),
      });

      await expect(schema.object()).rejects.toThrow(
        Errors.ValueGenerationError,
      );
    });

    it("a nested field throws. the error should point to the deepest field that actually failed", async () => {
      const schema = chaca.schema({
        address: chaca.schema({
          city: () => {
            throw new Error("city boom");
          },
        }),
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        const err = error as Errors.ValueGenerationError;
        expect(err.fieldRoute).toBe("Schema.address.city");
      }
    });

    it("a document index is available when several documents are generated", async () => {
      let call = 0;

      const schema = chaca.schema({
        broken: () => {
          call++;

          if (call === 3) {
            throw new Error("only fails on the 3rd document");
          }

          return "ok";
        },
      });

      try {
        await schema.array(5);
        expect.unreachable();
      } catch (error) {
        const err = error as Errors.ValueGenerationError;
        expect(err.index).toBe(2);
        expect(err.message).toContain("document 2");
      }
    });

    it("a ChacaError thrown by the user function is not wrapped again", async () => {
      const schema = chaca.schema({
        broken: () => {
          throw new ChacaError("a custom validation error");
        },
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ChacaError);
        expect(error).not.toBeInstanceOf(FieldGenerationError);
        expect((error as ChacaError).message).toBe("a custom validation error");
      }
    });

    it("a chaca validation error (e.g. wrong isArray return type) is not wrapped", async () => {
      const schema = chaca.schema({
        id: {
          type: () => modules.id.uuid(),
          isArray: () => "not valid" as never,
        },
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.WrongArrayDefinitionError);
        expect(error).not.toBeInstanceOf(FieldGenerationError);
      }
    });
  });

  describe("possibleNull function", () => {
    it("throws an Error. should be wrapped in a PossibleNullFunctionError", async () => {
      const schema = chaca.schema({
        maybe: {
          type: () => "value",
          possibleNull: () => {
            throw new Error("null check boom");
          },
        },
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.PossibleNullFunctionError);
        expect(error).toBeInstanceOf(FieldGenerationError);

        const err = error as Errors.PossibleNullFunctionError;
        expect(err.fieldRoute).toBe("Schema.maybe");
        expect(err.message).toContain("possibleNull");
      }
    });
  });

  describe("isArray function", () => {
    it("throws an Error. should be wrapped in an IsArrayFunctionError", async () => {
      const schema = chaca.schema({
        id: {
          type: () => modules.id.uuid(),
          isArray: () => {
            throw new Error("isArray boom");
          },
        },
      });

      try {
        await schema.object();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.IsArrayFunctionError);
        expect(error).toBeInstanceOf(FieldGenerationError);

        const err = error as Errors.IsArrayFunctionError;
        expect(err.fieldRoute).toBe("Schema.id");
        expect(err.message).toContain("isArray");
      }
    });
  });

  describe("ref.where function", () => {
    it("throws an Error. should be wrapped in a RefWhereFunctionError naming the ref target", async () => {
      const schema = chaca.schema({
        id: chaca.key(chaca.sequence()),
      });

      const schema2 = chaca.schema({
        ref: chaca.ref("schema.id", {
          where: () => {
            throw new Error("where boom");
          },
        }),
      });

      try {
        await chaca
          .dataset([
            { name: "schema", documents: 5, schema: schema },
            { name: "schema2", documents: 5, schema: schema2 },
          ])
          .generate();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.RefWhereFunctionError);
        expect(error).toBeInstanceOf(FieldGenerationError);

        const err = error as Errors.RefWhereFunctionError;
        expect(err.fieldRoute).toBe("schema2.ref");
        expect(err.refRoute).toBe("schema.id");
        expect(err.message).toContain("where");
      }
    });
  });

  describe("schema documents count function", () => {
    it("throws an Error. should be wrapped in a SchemaCountFunctionError naming the schema", async () => {
      const schema = chaca.schema({});

      try {
        await chaca
          .dataset([
            {
              name: "brokenSchema",
              documents: () => {
                throw new Error("count boom");
              },
              schema: schema,
            },
          ])
          .generate();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(Errors.SchemaCountFunctionError);
        expect(error).not.toBeInstanceOf(FieldGenerationError);

        const err = error as Errors.SchemaCountFunctionError;
        expect(err.schemaName).toBe("brokenSchema");
        expect(err.message).toContain("brokenSchema");
      }
    });
  });
});
