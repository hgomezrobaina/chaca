import { ChacaUtils } from "../../core/utils";
import { MIME_TYPES } from "./constants/mime-types";
import { FILE_EXTENSIONS } from "./constants/file-extensions";
import { WordModule } from "../word";
import { DatatypeModule } from "../datatype";
import { Language } from "../../core/locale/language";
import { nonStandardExpressions } from "./constants/non-standard-cron-expressions";

export interface CronProps {
  includeYear?: boolean;
  includeNonStandard?: boolean;
}

export type FilenameProps = {
  ext?: string;
};

const CRON_DAY_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export class SystemModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly datatypeModule: DatatypeModule,
    private readonly wordModule: WordModule,
  ) {}

  readonly constants = {
    fileExtensions: FILE_EXTENSIONS,
    mimeTypes: MIME_TYPES,
  };

  /**
   * Returns a file name
   * @param args.ext File extension
   * @example
   * modules.system.filename() // 'academy.png'
   * modules.system.filename({ ext: 'gif' }) // 'academy_button_school.gif'
   * @returns string
   */
  filename({ ext: iext }: FilenameProps = {}): string {
    const ext =
      typeof iext === "string" && iext.trim().length > 0
        ? `.${iext.trim().replace(/^\.+/, "")}`
        : this.fileExt();

    const length = this.datatypeModule.int({ min: 1, max: 5 });

    const arrayNames: string[] = Array.from({
      length: length,
    }).map(() => this.wordModule.noun({ language: Language.English }));

    return `${arrayNames.join("_")}${ext}`.trim();
  }

  /**
   * Returns a mime type
   * @example modules.system.mimeType() // 'video/mpeg'
   * @returns string
   */
  mimeType(): string {
    return this.utils.oneOfArray(MIME_TYPES);
  }

  /**
   * Return a file extension
   * @example modules.system.fileExt() // '.mp4'
   * @returns string
   */
  fileExt(): string {
    return this.utils.oneOfArray(Object.values(FILE_EXTENSIONS).flat());
  }

  /**
   * Returns a directory path
   *
   * @example modules.system.directoryPath() // 'user/files/videos'
   *
   * @returns string
   */
  directoryPath(): string {
    const countFolder = this.datatypeModule.int({ min: 1, max: 5 });
    const array = Array.from({ length: countFolder });

    for (let i = 0; i < array.length; i++) {
      array[i] = this.wordModule.noun();
    }

    return array.join("/");
  }

  /**
   * Returns a string with a system file path
   * @example
   * modules.system.filePath() // 'user/files/videos/academy.mp4'
   * @returns string
   */
  filePath(): string {
    return `${this.directoryPath()}/${this.filename()}`;
  }

  /**
   * Returns a [semantic version](https://semver.org).
   *
   * @example
   * modules.system.semver() // '1.1.2'
   */
  semver(): string {
    return [
      this.datatypeModule.int({ min: 0, max: 9 }),
      this.datatypeModule.int({ min: 0, max: 9 }),
      this.datatypeModule.int({ min: 0, max: 9 }),
    ].join(".");
  }

  /**
   * Returns a random cron expression.
   *
   * @param args.includeYear Whether to include a year in the generated expression. Default `false`.
   * @param args.includeNonStandard Whether to include a `@yearly`, `@monthly`, `@daily`, etc text labels in the generated expression. Default`false`.
   *
   * @example
   * modules.system.cron() // '45 23 * * 6'
   * modules.system.cron({ includeYear: true }) // '45 23 * * 6 2067'
   * modules.system.cron({ includeYear: false }) // '45 23 * * 6'
   * modules.system.cron({ includeNonStandard: false }) // '45 23 * * 6'
   * modules.system.cron({ includeNonStandard: true }) // '@yearly'
   */
  cron({
    includeYear = false,
    includeNonStandard = false,
  }: CronProps = {}): string {
    // create the arrays to hold the available values for each component of the expression
    const minutes = [this.datatypeModule.int({ min: 0, max: 59 }), "*"];
    const hours = [this.datatypeModule.int({ min: 0, max: 23 }), "*"];
    const days = [this.datatypeModule.int({ min: 1, max: 31 }), "*", "?"];
    const months = [this.datatypeModule.int({ min: 1, max: 12 }), "*"];
    const daysOfWeek = [
      this.datatypeModule.int({ min: 0, max: 6 }),
      this.utils.oneOfArray(CRON_DAY_OF_WEEK),
      "*",
      "?",
    ];
    const years = [this.datatypeModule.int({ min: 1970, max: 2099 }), "*"];

    const minute = this.utils.oneOfArray(minutes);
    const hour = this.utils.oneOfArray(hours);
    const day = this.utils.oneOfArray(days);
    const month = this.utils.oneOfArray(months);
    const dayOfWeek = this.utils.oneOfArray(daysOfWeek);
    const year = this.utils.oneOfArray(years);

    let standard = !includeNonStandard;

    // create and return the cron expression string
    let standardExpression = `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;

    if (includeYear) {
      standard = true;
      standardExpression += ` ${year}`;
    }

    return standard
      ? standardExpression
      : this.utils.oneOfArray(nonStandardExpressions);
  }
}
