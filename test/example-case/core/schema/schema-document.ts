import { CaseRule } from "../case-rule";
import { CaseEntity, CaseField, FieldKind, Nullability } from "./schema-reader";

interface Props<K> {
  caseName: string;
  entities: CaseEntity[];
  columnTypes: Map<string, string>;
  rules: CaseRule<K>[];
  diagram: string;
}

interface EntitySectionProps<K> {
  entity: CaseEntity;
  columnTypes: Map<string, string>;
  rules: CaseRule<K>[];
}

const KIND_ORIGIN: Record<FieldKind, string> = {
  [FieldKind.Key]: "`chaca.key`",
  [FieldKind.Ref]: "`chaca.ref`",
  [FieldKind.Enum]: "`chaca.enum`",
  [FieldKind.Probability]: "`chaca.probability`",
  [FieldKind.Sequence]: "`chaca.sequence`",
  [FieldKind.Sequential]: "`chaca.sequential`",
  [FieldKind.Pick]: "`chaca.pick`",
  [FieldKind.Nested]: "nested schema",
  [FieldKind.Custom]: "custom function",
};

const NULLABILITY_LABEL: Record<Nullability, string> = {
  [Nullability.Never]: "no",
  [Nullability.Always]: "yes",
  [Nullability.Conditional]: "sometimes",
};

/**
 * Assembles `schema.md`: the mermaid diagram, one field table per entity
 * (field · type · null · key · origin · rules), and the case's rule table.
 * Everything here is derived from `entities` (the schema's shape),
 * `columnTypes` (the data's shape) and `rules` — nothing is written by
 * hand, so the file can be regenerated and compared byte for byte.
 */
export class SchemaDocument {
  static execute<K>({
    caseName,
    entities,
    columnTypes,
    rules,
    diagram,
  }: Props<K>): string {
    const sections = [
      `# ${caseName} — schema`,
      "",
      "Generated from the schema definitions and the last generated dataset — see `test/example-case/README.md` for how to regenerate it. Do not edit by hand.",
      "",
      "## Diagram",
      "",
      "```mermaid",
      diagram.trimEnd(),
      "```",
      "",
      "## Entities",
      "",
    ];

    for (const entity of entities) {
      sections.push(
        ...SchemaDocument.entitySection({ entity, columnTypes, rules }),
      );
    }

    sections.push("## Rules", "", ...SchemaDocument.rulesTable(rules));

    return `${sections.join("\n")}\n`;
  }

  private static entitySection<K>({
    entity,
    columnTypes,
    rules,
  }: EntitySectionProps<K>): string[] {
    const lines = [
      `### ${entity.name}`,
      "",
      "| Field | Type | Null | Key | Origin | Rules |",
      "|---|---|---|---|---|---|",
    ];

    for (const field of entity.fields) {
      const type = columnTypes.get(`${entity.name}.${field.name}`) ?? "string";
      const ruleIds = rules
        .filter((rule) => {
          return rule.fields.includes(`${entity.name}.${field.name}`);
        })
        .map((rule) => {
          return rule.id;
        });

      lines.push(
        `| \`${field.name}\` | ${type} | ${NULLABILITY_LABEL[field.nullability]} | ${SchemaDocument.keyLabel(field)} | ${KIND_ORIGIN[field.kind]} | ${ruleIds.length > 0 ? ruleIds.join(", ") : "—"} |`,
      );
    }

    lines.push("");

    return lines;
  }

  private static keyLabel(field: CaseField): string {
    const parts: string[] = [];

    if (field.isPrimaryKey) {
      parts.push("PK");
    }

    if (field.ref !== null) {
      parts.push(`FK → ${field.ref.entity}.${field.ref.field}`);
    }

    return parts.length > 0 ? parts.join(", ") : "—";
  }

  private static rulesTable<K>(rules: CaseRule<K>[]): string[] {
    const lines = ["| Id | Rule | Fields |", "|---|---|---|"];

    for (const rule of rules) {
      const fields = rule.fields
        .map((field) => {
          return `\`${field}\``;
        })
        .join(", ");

      lines.push(`| ${rule.id} | ${rule.text} | ${fields} |`);
    }

    return lines;
  }
}
