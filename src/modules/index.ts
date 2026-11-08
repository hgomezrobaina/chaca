import { DatatypeModule } from "./datatype";
import { IdModule } from "./id";
import { InternetModule } from "./internet";
import { LoremModule } from "./lorem";
import { ImageModule } from "./image";
import { SystemModule } from "./system";
import { FinanceModule } from "./finance";
import { PhoneModule } from "./phone";
import { AddressModule } from "./address";
import { VehicleModule } from "./vehicle";
import { DateModule } from "./date";
import { PersonModule } from "./person";
import { AnimalModule } from "./animal";
import { ScienceModule } from "./science";
import { WordModule } from "./word";
import { ColorModule } from "./color";
import { DistributionModule } from "./distribution";
import { ChacaUtils } from "../core/utils";
import { LocaleRegistry } from "../core/locale/locale-registry";
import { LocaleCategoryResolver } from "../core/locale/locale-category-resolver";
import { LocaleDefinition } from "../core/locale/locale";

export class ChacaModules {
  /**
   * One registry (and one resolver over it) per instance, not per process:
   * two `ChacaModules` (two tests, or a library build and the server that
   * embeds it) each keep their own registered locales, and never leak into
   * one another.
   */
  private readonly registry = new LocaleRegistry();
  private readonly locales = new LocaleCategoryResolver(this.registry);

  readonly internet: InternetModule;
  readonly datatype: DatatypeModule;
  readonly id: IdModule;
  readonly lorem: LoremModule;
  readonly image: ImageModule;
  readonly system: SystemModule;
  readonly finance: FinanceModule;
  readonly phone: PhoneModule;
  readonly address: AddressModule;
  readonly word: WordModule;
  readonly vehicle: VehicleModule;
  readonly date: DateModule;
  readonly person: PersonModule;
  readonly animal: AnimalModule;
  readonly science: ScienceModule;
  readonly color: ColorModule;
  readonly distribution: DistributionModule;

  constructor(utils: ChacaUtils) {
    this.datatype = new DatatypeModule(utils);
    this.address = new AddressModule(utils, this.datatype, this.locales);
    this.id = new IdModule(this.datatype);
    this.color = new ColorModule(utils, this.datatype, this.locales);
    this.person = new PersonModule(utils, this.datatype, this.locales);
    this.word = new WordModule(utils, this.locales);
    this.internet = new InternetModule(
      this.datatype,
      utils,
      this.person,
      this.word,
    );
    this.science = new ScienceModule(utils, this.locales);
    this.vehicle = new VehicleModule(utils, this.locales);
    this.lorem = new LoremModule(this.datatype, this.locales);
    this.phone = new PhoneModule(utils, this.datatype);
    this.system = new SystemModule(utils, this.datatype, this.word);
    this.image = new ImageModule(this.datatype, this.word);
    this.finance = new FinanceModule(utils, this.datatype, this.locales);
    this.animal = new AnimalModule(utils, this.locales);
    this.date = new DateModule(this.datatype, utils, this.locales);
    this.distribution = new DistributionModule(utils);
  }

  /**
   * Registers a locale so every method that accepts `language` can return
   * its data. Registering the same code twice replaces the previous locale;
   * nothing is registered by default beyond the built-in `en`.
   */
  registerLocale(locale: LocaleDefinition): void {
    this.registry.register(locale);
  }
}
