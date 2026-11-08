import {
  DatasetSchema,
  EnumField,
  FieldObjectInput,
  FieldTypes,
  KeyField,
  PickField,
  PossibleNullConfig,
  ProbabilityField,
  RefField,
  Schema,
  SchemaFieldConfig,
  SequenceField,
  SequentialField,
} from "../../../../src";

export enum FieldKind {
  Key = "key",
  Ref = "ref",
  Enum = "enum",
  Probability = "probability",
  Sequence = "sequence",
  Sequential = "sequential",
  Pick = "pick",
  Nested = "nested",
  Custom = "custom",
}

export enum Nullability {
  Never = "never",
  Always = "always",
  Conditional = "conditional",
}

export interface CaseFieldRef {
  entity: string;
  field: string;
  unique: boolean;
  nullOnEmpty: boolean;
}

export interface CaseField {
  name: string;
  kind: FieldKind;
  isPrimaryKey: boolean;
  ref: CaseFieldRef | null;
  nullability: Nullability;
  isArray: boolean;
}

export interface CaseEntity {
  name: string;
  fields: CaseField[];
}

interface Props {
  name: string;
  config: SchemaFieldConfig;
}

interface BuildFieldProps {
  name: string;
  value: FieldTypes;
  wrapper: FieldObjectInput | null;
}

/**
 * Reads the structural shape of every case's schemas — straight from the
 * `chaca.dataset` definitions, never from generated data — into a plain
 * `CaseEntity[]` that `MermaidDiagram` and `SchemaDocument` can render
 * without knowing anything about chaca's field classes.
 */
export class SchemaReader {
  static execute(schemas: DatasetSchema[]): CaseEntity[] {
    return schemas.map((schema) => {
      return SchemaReader.readEntity(schema);
    });
  }

  private static readEntity(schema: DatasetSchema): CaseEntity {
    const fields = Object.entries(schema.schema.input).map(([name, config]) => {
      return SchemaReader.readField({ name, config });
    });

    return { name: schema.name, fields };
  }

  private static readField({ name, config }: Props): CaseField {
    if (SchemaReader.isFieldObjectInput(config)) {
      return SchemaReader.buildField({
        name,
        value: config.type,
        wrapper: config,
      });
    }

    return SchemaReader.buildField({ name, value: config, wrapper: null });
  }

  /**
   * A `FieldObjectInput` is a plain `{ type, isArray?, possibleNull? }`
   * literal, never an instance of a field class — so it's the only shape
   * left once every known class and the bare-function case are ruled out.
   */
  private static isFieldObjectInput(
    config: SchemaFieldConfig,
  ): config is FieldObjectInput {
    if (typeof config === "function") {
      return false;
    }

    if (
      config instanceof KeyField ||
      config instanceof RefField ||
      config instanceof EnumField ||
      config instanceof ProbabilityField ||
      config instanceof SequenceField ||
      config instanceof SequentialField ||
      config instanceof PickField ||
      config instanceof Schema
    ) {
      return false;
    }

    return true;
  }

  private static buildField({
    name,
    value,
    wrapper,
  }: BuildFieldProps): CaseField {
    const kind = SchemaReader.readKind(value);
    const isPrimaryKey = kind === FieldKind.Key;
    const ref = SchemaReader.readRef(value);
    const nullability = SchemaReader.readNullability(
      wrapper !== null ? wrapper.possibleNull : undefined,
    );
    const isArray = wrapper !== null && wrapper.isArray !== undefined;

    return { name, kind, isPrimaryKey, ref, nullability, isArray };
  }

  private static readKind(value: FieldTypes): FieldKind {
    if (typeof value === "function") {
      return FieldKind.Custom;
    }

    if (value instanceof KeyField) {
      return FieldKind.Key;
    }

    if (value instanceof RefField) {
      return FieldKind.Ref;
    }

    if (value instanceof EnumField) {
      return FieldKind.Enum;
    }

    if (value instanceof ProbabilityField) {
      return FieldKind.Probability;
    }

    if (value instanceof SequenceField) {
      return FieldKind.Sequence;
    }

    if (value instanceof SequentialField) {
      return FieldKind.Sequential;
    }

    if (value instanceof PickField) {
      return FieldKind.Pick;
    }

    return FieldKind.Nested;
  }

  /**
   * A direct `RefField`, or a `KeyField` wrapping one (the 1:1 inheritance
   * pattern: `chaca.key(chaca.ref("User.id", { unique: true, ... }))`).
   */
  private static readRef(value: FieldTypes): CaseFieldRef | null {
    const refField =
      value instanceof RefField
        ? value
        : value instanceof KeyField && value.field instanceof RefField
          ? value.field
          : null;

    if (refField === null) {
      return null;
    }

    const separator = refField.refField.refField.indexOf(".");

    return {
      entity: refField.refField.refField.slice(0, separator),
      field: refField.refField.refField.slice(separator + 1),
      unique: refField.refField.unique,
      nullOnEmpty: refField.refField.nullOnEmpty,
    };
  }

  private static readNullability(
    possibleNull: PossibleNullConfig,
  ): Nullability {
    if (possibleNull === undefined) {
      return Nullability.Never;
    }

    if (typeof possibleNull === "function") {
      return Nullability.Conditional;
    }

    if (typeof possibleNull === "boolean") {
      return possibleNull ? Nullability.Always : Nullability.Never;
    }

    if (possibleNull <= 0) {
      return Nullability.Never;
    }

    if (possibleNull >= 1) {
      return Nullability.Always;
    }

    return Nullability.Conditional;
  }
}
