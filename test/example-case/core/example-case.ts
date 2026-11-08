import { describe, expect, it } from "vitest";
import { chaca, DatasetSchema } from "../../../src";
import { CaseRule } from "./case-rule";

interface Props<K> {
  name: string;
  schemas: DatasetSchema[];
  rules: CaseRule<K>[];
}

export class ExampleCaseTest<K> {
  private readonly name: string;
  private readonly schemas: DatasetSchema[];
  private readonly rules: CaseRule<K>[];

  constructor({ name, schemas, rules }: Props<K>) {
    this.name = name;
    this.schemas = schemas;
    this.rules = rules;
  }

  execute(): void {
    describe(this.name, async () => {
      const dataset = chaca.dataset<K>(this.schemas);
      const data = await dataset.generate();

      this.checkRuleIdsAreUniqueAndWellFormed();
      this.checkRuleFieldsExist();
      this.checkEveryEntityIsCoveredByARule();

      for (const rule of this.rules) {
        it(`${rule.id}: ${rule.text}`, () => {
          rule.check(data);
        });
      }
    });
  }

  private checkRuleIdsAreUniqueAndWellFormed(): void {
    it("every rule has a unique, well-formed id", () => {
      const ids = this.rules.map((rule) => {
        return rule.id;
      });

      for (const id of ids) {
        expect(id).toMatch(/^R\d+$/);
      }

      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  private checkRuleFieldsExist(): void {
    it("every rule's fields reference an existing entity and field", () => {
      for (const rule of this.rules) {
        for (const fieldPath of rule.fields) {
          const [entityName, fieldName] = fieldPath.split(".");
          const schema = this.schemas.find((candidate) => {
            return candidate.name === entityName;
          });

          expect(schema).not.toBeUndefined();

          if (schema !== undefined) {
            expect(Object.keys(schema.schema.input)).toContain(fieldName);
          }
        }
      }
    });
  }

  private checkEveryEntityIsCoveredByARule(): void {
    it("every entity is covered by at least one rule", () => {
      const coveredEntities = new Set(
        this.rules.flatMap((rule) => {
          return rule.fields.map((fieldPath) => {
            return fieldPath.split(".")[0];
          });
        }),
      );

      for (const schema of this.schemas) {
        expect(coveredEntities).toContain(schema.name);
      }
    });
  }
}
