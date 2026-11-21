import { FieldValue } from "../schema/column-types";
import { CaseEntity } from "../schema/schema-reader";

interface Props {
  caseName: string;
  entities: CaseEntity[];
  data: Record<string, object[]>;
}

interface EntitySectionProps {
  entity: CaseEntity;
}

interface FieldStatsProps {
  rows: object[];
  fieldName: string;
}

interface FieldStats {
  nulls: number;
  distinct: number;
  min: string | null;
  max: string | null;
}

interface ExtremumProps {
  values: Exclude<FieldValue, null>[];
  pickLowest: boolean;
}

/**
 * A report of what a run actually generated — filled rows, real null
 * counts, distinct values, and the range of numbers and dates — computed
 * once over the data the rules already hold, never a second generation.
 * Not versioned: it exists to catch a sick run (e.g. 8 declared
 * departments collapsing into 3 distinct names) that passing assertions
 * alone would not show.
 */
export class GenerationReport {
  private readonly caseName: string;
  private readonly entities: CaseEntity[];
  private readonly data: Record<string, object[]>;

  constructor({ caseName, entities, data }: Props) {
    this.caseName = caseName;
    this.entities = entities;
    this.data = data;
  }

  execute(): string {
    const lines = [
      `# ${this.caseName} — generation report`,
      "",
      "Regenerated on every run of `test:cases`; not versioned. See `test/example-case/README.md`.",
      "",
      "## Rows",
      "",
      "| Entity | Rows |",
      "|---|---|",
    ];

    for (const entity of this.entities) {
      const rows = this.data[entity.name] ?? [];
      lines.push(`| \`${entity.name}\` | ${rows.length} |`);
    }

    lines.push("", "## Fields", "");

    for (const entity of this.entities) {
      lines.push(...this.entitySection({ entity }));
    }

    return `${lines.join("\n")}\n`;
  }

  private entitySection({ entity }: EntitySectionProps): string[] {
    const rows = this.data[entity.name] ?? [];
    const lines = [
      `### ${entity.name}`,
      "",
      "| Field | Nulls | Distinct | Min | Max |",
      "|---|---|---|---|---|",
    ];

    for (const field of entity.fields) {
      const stats = this.fieldStats({ rows, fieldName: field.name });

      lines.push(
        `| \`${field.name}\` | ${stats.nulls} / ${rows.length} | ${stats.distinct} | ${stats.min ?? "—"} | ${stats.max ?? "—"} |`,
      );
    }

    lines.push("");

    return lines;
  }

  private fieldStats({ rows, fieldName }: FieldStatsProps): FieldStats {
    const values = rows.map((row) => {
      return (row as Record<string, FieldValue>)[fieldName];
    });

    const nonNull = values.filter(
      (value): value is Exclude<FieldValue, null> => {
        return value !== null && value !== undefined;
      },
    );

    const distinct = new Set(
      nonNull.map((value) => {
        return this.stableKey(value);
      }),
    ).size;

    return {
      nulls: values.length - nonNull.length,
      distinct,
      min: this.extremum({ values: nonNull, pickLowest: true }),
      max: this.extremum({ values: nonNull, pickLowest: false }),
    };
  }

  private extremum({ values, pickLowest }: ExtremumProps): string | null {
    const [first] = values;

    if (first === undefined) {
      return null;
    }

    if (typeof first === "number") {
      const numbers = values.filter((value): value is number => {
        return typeof value === "number";
      });

      return String(pickLowest ? Math.min(...numbers) : Math.max(...numbers));
    }

    if (first instanceof Date) {
      const times = values
        .filter((value): value is Date => {
          return value instanceof Date;
        })
        .map((date) => {
          return date.getTime();
        });

      return new Date(
        pickLowest ? Math.min(...times) : Math.max(...times),
      ).toISOString();
    }

    return null;
  }

  private stableKey(value: Exclude<FieldValue, null>): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    return String(value);
  }
}
