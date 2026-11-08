import { ExportFormat, Extensions } from "../interfaces/export";
import { ChacaError } from "../../../errors";

const EXTENSIONS: Extensions[] = [
  "json",
  "java",
  "typescript",
  "csv",
  "javascript",
  "yaml",
  "python",
  "postgresql",
  "sqlite",
  "mysql",
];

export class FileFormat {
  private readonly _value: ExportFormat;

  constructor(format?: ExportFormat) {
    this._value = this.validate(format);
  }

  /**
   * Checks that the format names a known extension and keeps its config
   * untouched.
   *
   * The options of each format (`keys`, `indent`, `package`, `separate`...)
   * are parsed by its own generator's constructor, so copying a subset of
   * them here would only drop the rest.
   */
  private validate(format?: ExportFormat): ExportFormat {
    if (typeof format === "string") {
      return format;
    }

    if (typeof format === "object" && format !== null) {
      if (EXTENSIONS.includes(format.ext)) {
        return format;
      }
    }

    throw new ChacaError(`Invalid format for exportation`);
  }

  public value(): ExportFormat {
    return this._value;
  }
}
