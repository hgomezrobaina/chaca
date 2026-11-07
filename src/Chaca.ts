import { KeyField, KeyFieldProps } from "./core/fields/core/key/key-field";
import { ChacaUtils } from "./core/utils";
import { SchemaInput } from "./core/schema/interfaces/schema";
import { DatasetSchema } from "./core/dataset-resolver/interfaces/dataset-schema";
import { ExportResolver } from "./core/export/resolvers/export/export";
import { FileWriter } from "./core/export/writers/file-writer";
import { DumpConfig, FileConfig } from "./core/export/interfaces/export";
import { PickField, PickFieldProps } from "./core/fields/core/pick/pick-field";
import { DatatypeModule } from "./modules/datatype";
import { GeneratorFilter } from "./core/export/resolvers/generator-filter/generator-filter";
import { DumpFile } from "./core/export/generators/generator/generator";
import { DumpResolver } from "./core/export/resolvers/dump/dump";
import {
  EnumField,
  ProbabilityField,
  RefField,
  SequenceField,
  SequentialField,
} from "./core/fields/core";
import { ProbabilityOption } from "./core/fields/core/probability/probability-field";
import { Dataset } from "./core/dataset/dataset";
import { SequenceFieldProps } from "./core/fields/core/sequence/sequence-field";
import { SequentialFieldConfig } from "./core/fields/core/sequential/sequential-field";
import { FieldToRef, RefFieldConfig } from "./core/fields/core/ref/ref-field";
import { Schema } from "./core/schema/schema";

export class Chaca {
  constructor(
    private readonly datatypeModule: DatatypeModule,
    readonly utils: ChacaUtils,
    private readonly fileWriter: FileWriter,
  ) {}

  /**
   * @param input The object with the keys and type of each field
   *
   * @example
   * chaca.schema({
   *    id: chaca.key(() => modules.id.uuid()),
   *    image: () => modules.image.film(),
   *    name: () => modules.person.firstName()
   * })
   */
  schema<K = any>(input: SchemaInput): Schema<K> {
    const newSchema = new Schema<K>(
      input,
      this.utils,
      this.datatypeModule,
      this.fileWriter,
    );
    return newSchema;
  }

  /**
   * Create a reference field for a selected schema
   * @param field Configuration of the reference field. the field location must be separated points
   * @param config.unique The value to be referenced will only be taken once by this schema. Default `false`
   * @param config.where Function that filters the fields to reference
   * @param config.nullOnEmpty When there are no more documents to reference, the generated value will be null. Default `false`
   *
   * @example
   * chaca.ref('schema.field')
   */
  ref(field: FieldToRef, config?: RefFieldConfig): RefField {
    return new RefField(field, config);
  }

  /**
   * Sequential field
   *
   * @param values Array of the secuential values
   * @param config.loop Boolean indicating whether the values should be generated cyclically. Default `false`
   * @example
   * chaca.schema({
   *   number: chaca.sequential([1, 2, 3])
   * })
   *
   * // array result
   * [
   *    { number: 1 },
   *    { number: 2 },
   *    { number: 3 }
   * ]
   */
  sequential<K = any>(values: K[], config?: SequentialFieldConfig) {
    return new SequentialField(values, config);
  }

  /**
   * Sequence field
   * @param config.startsWith Init value for the field. Default `1`
   * @param config.step Step between field values in schema documents. Default `1`
   *
   * @example
   * chaca.sequence()
   * chaca.sequence({ startsWith: 10 })
   * chaca.sequence({ step: 0.5 })
   */
  sequence(config?: SequenceFieldProps) {
    return new SequenceField(config);
  }

  /**
   * Key field
   * @param field field that will return the value. Could be (`RefField` | `SequenceField` | `CustomField` )
   *
   * @example
   * chaca.key(chaca.sequence())
   * chaca.key(() => modules.id.uuid())
   */
  key(field: KeyFieldProps) {
    return new KeyField(field);
  }

  /**
   * Enum field
   * @param values Array of posible values
   *
   * @example
   * chaca.enum(["category1", "category2", "category3"])
   */
  enum<R = any>(values: ReadonlyArray<R>) {
    return new EnumField<R>(values);
  }

  /**
   * Export the data to a selected code format
   * @param data Data you want to export
   * @param config.filename file name
   * @param config.location location of the file
   * @param config.format file extension (`'java'` | `'csv'` | `'typescript'` | `'json'` | `'javascript'` | `'yaml'` | `'postgresql'` | `'sqlite'` | `'mysql'` | `'python'`)
   *
   * @example
   * const data = [
   *  { id: 1, name: 'Alberto', age: 20 },
   *  { id: 2, name: 'Carolina', age: 28 }
   * ]
   * const config = { filename: 'users', format: 'json', location: '../../data' }
   *
   * await chaca.export(data, config)
   *
   * @returns
   * Promise<string[]>
   */
  async export(data: any, config: FileConfig): Promise<string[]> {
    const filter = new GeneratorFilter(this.utils);
    const resolver = new ExportResolver(
      this.utils,
      this.datatypeModule,
      filter,
      this.fileWriter,
      config,
    );

    const route = await resolver.data(data);

    return route;
  }

  /**
   * Generate data from realtional schemas
   * @param schemas Array with the schemas config
   */
  dataset<K = any>(schemas: DatasetSchema[]): Dataset<K> {
    const dataset = new Dataset<K>(
      schemas,
      this.utils,
      this.datatypeModule,
      this.fileWriter,
    );
    return dataset;
  }

  /**
   * Probability field. Picks one of the given options, with each one's odds
   * proportional to its `chance`.
   *
   * @param options Array of options to choose from. Where each one has the 'chance' parameter to indicate the probability of being chosen.
   *
   * The options do not need their `chance` to add up to `1`: each `chance`
   * is a **relative weight**, not an absolute probability, and the one
   * actually picked is `chance / sum(every chance)`. A set of chances that
   * sums to less than `1` (e.g. `0.2` and `0.3`) splits in the same `2 : 3`
   * proportion as one that sums to more than `1` (e.g. `0.6` and `0.9`) —
   * there is no "remaining" probability that falls through to `null` or to
   * a default option. Every individual `chance`, though, must still be a
   * number between `0` and `1` (or a function that returns one); it is the
   * sum across options that is unconstrained.
   *
   * An option with `chance: 0` can never be picked. If every option's
   * `chance` evaluates to `0`, there is nothing to pick from, and
   * generation throws `WrongProbabilityFieldDefinitionError`.
   *
   * `chance` as a function is called fresh for **every generated
   * document** (not once for the whole array), with the same
   * `currentFields`/`store` a `custom` field receives — so it can depend on
   * another field already generated for that same document.
   *
   * @example
   * chaca.probability([
   *   { chance: 0.9, value: 10 },
   *   { chance: 0.5, value: 5 },
   *   { chance: 0.1, value: 1 },
   * ])
   */
  probability<T = any>(options: ProbabilityOption<T>[]): ProbabilityField<T> {
    return new ProbabilityField<T>(options);
  }

  /**
   * Select a number of elements in an array so that all selected values are not repeated
   *
   * @param props.values array of values
   * @param props.count number of items to select
   *
   * @example
   * chaca.pick({
   *    values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
   *    count: 3
   * })
   *
   * // [2, 6, 10] or [4, 5, 1] or [1, 9, 8] or ...
   */
  pick<V = any>(props: PickFieldProps<V>) {
    return new PickField<V>(props);
  }

  /**
   * Serializes `data` as a specific file format
   *
   * @param data Data to transform
   * @param props.filename name for the file
   * @param props.format file extension (`'java'` | `'csv'` | `'typescript'` | `'json'` | `'javascript'` | `'yaml'` | `'postgresql'` | `'sqlite'` | `'mysql'` | `'python'`)
   */
  transform(data: any, props: DumpConfig): DumpFile[] {
    const filter = new GeneratorFilter(this.utils);
    const resolver = new DumpResolver(
      this.utils,
      this.datatypeModule,
      filter,
      props,
    );

    return resolver.data(data);
  }
}
