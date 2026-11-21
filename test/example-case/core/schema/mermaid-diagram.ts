import { CaseEntity, CaseField, Nullability } from "./schema-reader";

interface Props {
  entities: CaseEntity[];
  columnTypes: Map<string, string>;
}

interface EntityBlockProps {
  entity: CaseEntity;
  columnTypes: Map<string, string>;
}

interface AttributeLineProps {
  field: CaseField;
  entity: string;
  columnTypes: Map<string, string>;
}

/**
 * Renders a case's `CaseEntity[]` as a mermaid `erDiagram`: one attribute
 * block per entity, with its type (from `columnTypes`), `PK`/`FK` markers
 * and a comment carrying nullability and uniqueness, followed by one
 * relationship line per `chaca.ref` field. No `UK` marker (mermaid's
 * support for it is inconsistent across versions); uniqueness goes in the
 * attribute's comment instead, which always renders.
 */
export class MermaidDiagram {
  static execute({ entities, columnTypes }: Props): string {
    const lines = ["erDiagram"];

    for (const entity of entities) {
      lines.push(...MermaidDiagram.entityBlock({ entity, columnTypes }));
    }

    for (const entity of entities) {
      lines.push(...MermaidDiagram.relationships(entity));
    }

    return `${lines.join("\n")}\n`;
  }

  private static entityBlock({
    entity,
    columnTypes,
  }: EntityBlockProps): string[] {
    const lines = [`    ${entity.name} {`];

    for (const field of entity.fields) {
      const attribute = MermaidDiagram.attributeLine({
        field,
        entity: entity.name,
        columnTypes,
      });

      lines.push(`        ${attribute}`);
    }

    lines.push("    }");

    return lines;
  }

  private static attributeLine({
    field,
    entity,
    columnTypes,
  }: AttributeLineProps): string {
    const type = columnTypes.get(`${entity}.${field.name}`) ?? "string";

    const keys: string[] = [];
    if (field.isPrimaryKey) {
      keys.push("PK");
    }
    if (field.ref !== null) {
      keys.push("FK");
    }

    const comment = MermaidDiagram.comment(field);

    const keySuffix = keys.length > 0 ? ` ${keys.join(", ")}` : "";
    const commentSuffix = comment !== null ? ` "${comment}"` : "";

    return `${type} ${field.name}${keySuffix}${commentSuffix}`;
  }

  private static comment(field: CaseField): string | null {
    const parts: string[] = [];

    if (field.nullability === Nullability.Always) {
      parts.push("always null");
    } else if (field.nullability === Nullability.Conditional) {
      parts.push("nullable");
    }

    if (field.ref !== null && field.ref.unique) {
      parts.push("unique");
    }

    if (field.ref !== null && field.ref.nullOnEmpty) {
      parts.push("null on empty");
    }

    if (field.isArray) {
      parts.push("array");
    }

    return parts.length > 0 ? parts.join(", ") : null;
  }

  private static relationships(entity: CaseEntity): string[] {
    const lines: string[] = [];

    for (const field of entity.fields) {
      if (field.ref === null) {
        continue;
      }

      const parentOptional =
        field.nullability !== Nullability.Never || field.ref.nullOnEmpty;
      const left = parentOptional ? "|o" : "||";
      const right = field.ref.unique ? "o|" : "o{";

      lines.push(
        `    ${field.ref.entity} ${left}--${right} ${entity.name} : ${field.name}`,
      );
    }

    return lines;
  }
}
