import { CaseEntity } from "./schema-reader";

export type FieldValue = string | number | boolean | Date | null | FieldValue[];

interface Props {
  entities: CaseEntity[];
  data: Record<string, object[]>;
}

interface ReadTypeProps {
  rows: object[];
  fieldName: string;
  entity: string;
}

/**
 * Infers each column's type from the data a case actually generated, never
 * from the schema: a `custom` field (a plain function) has no declared
 * type, so the only way to document it is to look at what came out.
 *
 * A column with no non-null value across every generated row fails loudly
 * instead of printing "unknown" — in a dataset of hundreds of rows that is
 * a sick generation, not a documentation detail.
 */
export class ColumnTypes {
  static execute({ entities, data }: Props): Map<string, string> {
    const types = new Map<string, string>();

    for (const entity of entities) {
      const rows = data[entity.name] ?? [];

      for (const field of entity.fields) {
        const type = ColumnTypes.readType({
          rows,
          fieldName: field.name,
          entity: entity.name,
        });

        types.set(`${entity.name}.${field.name}`, type);
      }
    }

    return types;
  }

  private static readType({ rows, fieldName, entity }: ReadTypeProps): string {
    const values = rows
      .map((row) => {
        return (row as Record<string, FieldValue>)[fieldName];
      })
      .filter((value): value is Exclude<FieldValue, null> => {
        return value !== null && value !== undefined;
      });

    if (values.length === 0) {
      throw new Error(
        `${entity}.${fieldName} has no non-null value across ${rows.length} generated rows; cannot infer its type.`,
      );
    }

    const [first] = values;

    if (Array.isArray(first)) {
      return "array";
    }

    if (first instanceof Date) {
      return "date";
    }

    if (typeof first === "boolean") {
      return "boolean";
    }

    if (typeof first === "number") {
      const hasDecimal = values.some((value) => {
        return typeof value === "number" && !Number.isInteger(value);
      });

      return hasDecimal ? "float" : "int";
    }

    return "string";
  }
}
