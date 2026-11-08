import { ChacaUtils } from "../../core/utils";
import {
  BEAR,
  BIRD,
  CAT,
  CETACEAN,
  COW,
  CROCODILIA,
  DOG,
  HORSE,
  INSECT,
  LION,
  RABBIT,
  RODENT,
  SNAKE,
  FISH,
} from "./constants";
import { LanguageProps } from "../../core/locale/language";
import { LocaleCategoryResolver } from "../../core/locale/locale-category-resolver";

export class AnimalModule {
  constructor(
    private readonly utils: ChacaUtils,
    private readonly locales: LocaleCategoryResolver,
  ) {}

  get constants() {
    return {
      animalTypes: this.locales.byLanguage((locale) => locale.animal.types),
      bears: BEAR,
      birds: BIRD,
      cats: CAT,
      ceteceans: CETACEAN,
      cows: COW,
      cocodrilas: CROCODILIA,
      dogs: DOG,
      hourses: HORSE,
      insects: INSECT,
      lions: LION,
      rabbits: RABBIT,
      rodents: RODENT,
      snakes: SNAKE,
      fishes: FISH,
    };
  }

  /**
   * Returns a dog breed
   * @example modules.animal.dog() // 'Irish Water Spaniel'
   * @returns string
   */
  dog(): string {
    return this.utils.oneOfArray(DOG);
  }

  /**
   * Returns a bear breed
   * @example modules.animal.bear() // 'Singapuria'
   * @returns string
   */
  bear(): string {
    return this.utils.oneOfArray(BEAR);
  }

  /**
   * Returns a bird breed
   * @example modules.animal.bird() // 'Singapuria'
   * @returns string
   */
  bird(): string {
    return this.utils.oneOfArray(BIRD);
  }

  /**
   * Returns a cat breed
   * @example modules.animal.cat() // 'Bengal'
   * @returns string
   */
  cat(): string {
    return this.utils.oneOfArray(CAT);
  }

  /**
   * Returns a cetacean breed
   * @example modules.animal.cetacean() // 'Spinner Dolphin'
   * @returns string
   */
  cetacean(): string {
    return this.utils.oneOfArray(CETACEAN);
  }

  /**
   * Returns a cow breed
   * @example modules.animal.cow() // 'Brava'
   * @returns string
   */
  cow(): string {
    return this.utils.oneOfArray(COW);
  }

  /**
   * Returns a crocodilia breed
   * @example modules.animal.crocodilia() // 'Philippine Crocodile'
   * @returns string
   */
  crocodilia(): string {
    return this.utils.oneOfArray(CROCODILIA);
  }

  /**
   * Returns a fish breed
   * @example modules.animal.fish() // 'Mandarin fish'
   * @returns string
   */
  fish(): string {
    return this.utils.oneOfArray(FISH);
  }

  /**
   * Returns a horse breed
   * @example modules.animal.horse() // 'Swedish Warmblood'
   * @returns string
   */
  horse(): string {
    return this.utils.oneOfArray(HORSE);
  }

  /**
   * Returns a insect breed
   * @example modules.animal.insect() // 'Pyramid ant'
   * @returns string
   */
  insect(): string {
    return this.utils.oneOfArray(INSECT);
  }

  /**
   * Returns a lion breed
   * @example modules.animal.lion() // 'Northeast Congo Lion'
   * @returns string
   */
  lion(): string {
    return this.utils.oneOfArray(LION);
  }

  /**
   * Returns a rabbit breed
   * @example modules.animal.rabbit() // 'Florida White'
   * @returns string
   */
  rabbit(): string {
    return this.utils.oneOfArray(RABBIT);
  }

  /**
   * Returns a rodent breed
   * @example modules.animal.rodent() // 'Cuscomys ashanika'
   * @returns string
   */
  rodent(): string {
    return this.utils.oneOfArray(RODENT);
  }

  /**
   * Returns a snake breed
   * @example modules.animal.snake() // 'Eyelash viper'
   * @returns string
   */
  snake(): string {
    return this.utils.oneOfArray(SNAKE);
  }

  /**
   * Returns an animal type from a registered locale.
   * @param args.language Locale to read from. Defaults `en`
   * @example modules.animal.type() // 'dog'
   * @returns string
   */
  type({ language }: LanguageProps = {}): string {
    const types = this.locales.execute({
      language,
      select: (locale) => locale.animal.types,
    });

    return this.utils.oneOfArray(types);
  }
}
