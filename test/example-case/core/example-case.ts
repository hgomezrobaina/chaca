import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import mermaid from "mermaid";
import { chaca, DatasetSchema } from "../../../src";
import { CaseRule } from "./case-rule";
import { GenerationReport } from "./report/generation-report";
import { ColumnTypes } from "./schema/column-types";
import { MermaidDiagram } from "./schema/mermaid-diagram";
import { SchemaDocument } from "./schema/schema-document";
import { CaseEntity, SchemaReader } from "./schema/schema-reader";

interface Props<K> {
  name: string;
  slug: string;
  schemas: DatasetSchema[];
  rules: CaseRule<K>[];
}

interface DataProps<K> {
  entities: CaseEntity[];
  data: K;
}

export class ExampleCaseTest<K> {
  private readonly name: string;
  private readonly slug: string;
  private readonly schemas: DatasetSchema[];
  private readonly rules: CaseRule<K>[];

  constructor({ name, slug, schemas, rules }: Props<K>) {
    this.name = name;
    this.slug = slug;
    this.schemas = schemas;
    this.rules = rules;
  }

  execute(): void {
    describe(this.name, async () => {
      const dataset = chaca.dataset<K>(this.schemas);
      const data = await dataset.generate();
      const entities = SchemaReader.execute(this.schemas);

      this.checkRuleIdsAreUniqueAndWellFormed();
      this.checkRuleFieldsExist();
      this.checkEveryEntityIsCoveredByARule();

      for (const rule of this.rules) {
        it(`${rule.id}: ${rule.text}`, () => {
          rule.check(data);
        });
      }

      this.checkSchemaDocument({ entities, data });
      this.checkGenerationReport({ entities, data });
    });
  }

  private checkSchemaDocument({ entities, data }: DataProps<K>): void {
    const columnTypes = ColumnTypes.execute({
      entities,
      data: data as Record<string, object[]>,
    });
    const diagram = MermaidDiagram.execute({ entities, columnTypes });
    const document = SchemaDocument.execute({
      caseName: this.name,
      entities,
      columnTypes,
      rules: this.rules,
      diagram,
    });

    it("the diagram is valid mermaid", async () => {
      await mermaid.parse(diagram);
    });

    it("schema.md is up to date", async () => {
      await expect(document).toMatchFileSnapshot("./schema.md");
    });
  }

  private checkGenerationReport({ entities, data }: DataProps<K>): void {
    it("writes the generation report", () => {
      const rows = data as Record<string, object[]>;
      const generationReport = new GenerationReport({
        caseName: this.name,
        entities,
        data: rows,
      });
      const report = generationReport.execute();

      for (const entity of entities) {
        const entityRows = rows[entity.name] ?? [];

        expect(report).toContain(
          `| \`${entity.name}\` | ${entityRows.length} |`,
        );
      }

      const dir = join("data", "cases", this.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "report.md"), report);
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
