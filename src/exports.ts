import {
  SchemaInput,
  FieldObjectInput,
  IsArrayConfig,
  PossibleNullConfig,
  FieldTypes,
  SchemaFieldConfig,
  PossibleNullFunction,
  PossibleNullFunctionProps,
} from "./core/schema/interfaces/schema";

import {
  CustomField,
  CustomFieldProps,
} from "./core/fields/core/custom/custom-field";

import {
  ExportFormat,
  FileConfig,
  ExportSQLFormat,
  JsonFormatConfig,
  CsvFormatConfig,
  JavaFormatConfig,
  JavascriptFormatConfig,
  ExtensionConfigs,
  Extensions,
  PostgresqlFormatConfig,
  PythonFormatConfig,
  TypescriptFormatConfig,
  YamlFormatConfig,
} from "./core/export/interfaces/export";

import { Schema } from "./core/schema/schema";

import {
  ChacaError,
  EmptySequentialValuesError,
  TryRefANoKeyFieldError,
  NotEnoughValuesForRefError,
  CyclicAccessDataError,
  NotExistRefFieldError,
  EmptyEnumValuesError,
  PickFieldDefinitionError,
  FieldGenerationError,
} from "./errors";

import {
  GetStoreConfig,
  GetStoreWhere,
} from "./core/schema-store/interfaces/schema-store";

import {
  DatasetSchema,
  DatasetSchemaCount,
  DatasetSchemaCountFunction,
  DatasetSchemaCountFunctionProps,
} from "./core/dataset-resolver/interfaces/dataset-schema";

import {
  RefFieldConfig,
  FieldToRef,
  RefField,
  RefFieldWhereProps,
  RefFieldWhere,
} from "./core/fields/core/ref/ref-field";

import {
  SequentialField,
  SequentialFieldConfig,
} from "./core/fields/core/sequential/sequential-field";

import { KeyField, KeyFieldProps } from "./core/fields/core/key/key-field";

import {
  SequenceField,
  SequenceFieldProps,
} from "./core/fields/core/sequence/sequence-field";

import { DatasetStore } from "./core/dataset-store/dataset-store";
import { EnumField } from "./core/fields/core/enum/enum-field";
import { Chaca } from "./Chaca";
import { ChacaUtils } from "./core/utils";

import {
  ProbabilityField,
  Chance,
  ProbabilityOption,
  ChanceFunction,
  ChanceFunctionProps,
} from "./core/fields/core/probability/probability-field";

import {
  PickField,
  PickFieldProps,
  PickCount,
  PickCountFunction,
  PickCountFunctionProps,
  PickCountLimits,
} from "./core/fields/core/pick/pick-field";

import { ChacaModules } from "./modules";
import { Dataset } from "./core/dataset/dataset";
import { DumpConfig, DumpFile } from "./core/export/resolvers/dump/dump";
import { FileWriter, WriteFilesProps } from "./core/export/writers/file-writer";

export {
  TryRefANoKeyFieldError,
  EmptySequentialValuesError,
  CyclicAccessDataError,
  ChacaError,
  NotEnoughValuesForRefError,
  NotExistRefFieldError,
  EmptyEnumValuesError,
  PickFieldDefinitionError,
  FieldGenerationError,
};

/**
 * Namespace grouping every error the library can throw. Preferred over the flat
 * exports for discoverability, e.g. `Errors.TryRefANoKeyFieldError`. It always
 * stays in sync with `./errors`, so newly added exceptions are exposed here
 * automatically. `ChacaError` (the base class of all of them) is also kept as a
 * top-level export for the common catch-all `instanceof ChacaError` check.
 */
export * as Errors from "./errors";

export {
  KeyField,
  RefField,
  EnumField,
  SequenceField,
  SequentialField,
  ProbabilityField,
  PickField,
};

export { Schema, DatasetStore, Chaca, ChacaUtils, ChacaModules };

export type {
  CustomField,
  SchemaInput,
  ExportFormat,
  FileConfig,
  DatasetSchema,
  DatasetSchemaCount,
  DatasetSchemaCountFunction,
  DatasetSchemaCountFunctionProps,
  FieldToRef,
  RefFieldWhere,
  GetStoreConfig,
  ExportSQLFormat,
  SequenceFieldProps,
  KeyFieldProps,
  RefFieldConfig,
  FieldObjectInput,
  IsArrayConfig,
  PossibleNullConfig,
  CustomFieldProps,
  SequentialFieldConfig,
  RefFieldWhereProps,
  FieldTypes,
  SchemaFieldConfig,
  PossibleNullFunction,
  PossibleNullFunctionProps,
  Chance,
  ProbabilityOption,
  ChanceFunction,
  ChanceFunctionProps,
  PickFieldProps,
  GetStoreWhere,
  PickCount,
  PickCountFunctionProps,
  PickCountFunction,
  PickCountLimits,
  DumpConfig,
  DumpFile,
  FileWriter,
  WriteFilesProps,
};

export type {
  JsonFormatConfig,
  CsvFormatConfig,
  JavaFormatConfig,
  JavascriptFormatConfig,
  ExtensionConfigs,
  Extensions,
  PostgresqlFormatConfig,
  PythonFormatConfig,
  TypescriptFormatConfig,
  YamlFormatConfig,
};

export { Dataset };
