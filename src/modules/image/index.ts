import { DatatypeModule } from "../datatype";
import { WordModule } from "../word";

interface ImageProps {
  width?: number;
  height?: number;
}

interface CategoryProps {
  width?: number;
  height?: number;
  category?: string;
}

const IMAGE_HOST = "https://loremflickr.com";
const AVATAR_HOST = "https://api.dicebear.com/9.x/adventurer/svg";

/** Used when a provided category has no usable characters (e.g. `"!!!"`) */
const FALLBACK_TAG = "nature";

export class ImageModule {
  constructor(
    private readonly datatypeModule: DatatypeModule,
    private readonly wordModule: WordModule,
  ) {}

  /**
   * Turns a free-form category into loremflickr tags.
   *
   * Whitespace separates tags (`"sports car"` -> `"sports,car"`) and characters
   * that are not letters, digits or hyphens are dropped, because loremflickr
   * rejects an encoded space in the path.
   */
  private tags(category: string): string {
    const tags = category
      .toLowerCase()
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/[^\p{L}\p{N}-]/gu, ""))
      .filter((tag) => tag.length > 0)
      .map((tag) => encodeURIComponent(tag));

    return tags.length > 0 ? tags.join(",") : FALLBACK_TAG;
  }

  private size(value: number | undefined, fallback: number): number {
    return value === undefined ? fallback : Math.max(1, Math.trunc(value));
  }

  private buildUrl(
    category: string = this.wordModule.noun({ language: "en" }),
    { height: iheight, width: iwidth }: ImageProps = {},
  ) {
    const size = this.datatypeModule.int({ min: 640, max: 4000 });

    const width = this.size(iwidth, size);
    const height = this.size(iheight, size);

    // `lock` pins the result to one image, so the same seed keeps returning
    // the same url instead of a different picture on every request.
    const lock = this.datatypeModule.int({ min: 1, max: 100000 });

    return `${IMAGE_HOST}/${width}/${height}/${this.tags(category)}?lock=${lock}`;
  }

  /**
   * Returns an image url from a category
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @example
   * modules.image.category({ category: "soccer" })
   *
   * @returns string
   */
  category(props: CategoryProps = {}): string {
    return this.buildUrl(props.category, props);
  }

  /**
   * Return a food image url
   *
   * @example
   * modules.image.food()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  food(props?: ImageProps): string {
    return this.buildUrl("food", props);
  }

  /**
   * Return a event image url
   *
   * @example
   * modules.image.event()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  event(props?: ImageProps): string {
    return this.buildUrl("event", props);
  }

  /**
   * Return a wallpaper image url
   *
   * @example
   * modules.image.wallpaper()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  wallpaper(props?: ImageProps): string {
    return this.buildUrl("wallpaper", props);
  }

  /**
   * Return a 3D image url
   *
   * @example
   * modules.image.treeDimension()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  threeDimension(props?: ImageProps): string {
    return this.buildUrl("3d", props);
  }

  /**
   * Return a architecture image url
   *
   * @example
   * modules.image.architecture()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  architecture(props?: ImageProps): string {
    return this.buildUrl("architecture", props);
  }

  /**
   * Return a nature image url
   *
   * @example
   * modules.image.nature()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  nature(props?: ImageProps): string {
    return this.buildUrl("nature", props);
  }

  /**
   * Return a fashion image url
   *
   * @example
   * modules.image.fashion()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  fashion(props?: ImageProps): string {
    return this.buildUrl("fashion", props);
  }

  /**
   * Return a film image url
   *
   * @example
   * modules.image.film()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  film(props?: ImageProps): string {
    return this.buildUrl("film", props);
  }

  /**
   * Return a people image url
   *
   * @example
   * modules.image.people()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  people(props?: ImageProps): string {
    return this.buildUrl("people", props);
  }

  /**
   * Return a health image url
   *
   * @example
   * modules.image.health()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  health(props?: ImageProps): string {
    return this.buildUrl("health", props);
  }

  /**
   * Return a house image url
   *
   * @example
   * modules.image.house()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  house(props?: ImageProps): string {
    return this.buildUrl("house", props);
  }

  /**
   * Return a street image url
   *
   * @example
   * modules.image.street()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  street(props?: ImageProps): string {
    return this.buildUrl("street", props);
  }

  /**
   * Return a animal image url
   *
   * @example
   * modules.image.animal()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  animal(props?: ImageProps): string {
    return this.buildUrl("animal", props);
  }

  /**
   * Return a spiritual image url
   *
   * @example
   * modules.image.spiritual()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  spiritual(props?: ImageProps): string {
    return this.buildUrl("spiritual", props);
  }

  /**
   * Return a travel image url
   *
   * @example
   * modules.image.travel()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  travel(props?: ImageProps): string {
    return this.buildUrl("travel", props);
  }

  /**
   * Return a art image url
   *
   * @example
   * modules.image.art()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  art(props?: ImageProps): string {
    return this.buildUrl("art", props);
  }

  /**
   * Return a history image url
   *
   * @example
   * modules.image.history()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  history(props?: ImageProps): string {
    return this.buildUrl("history", props);
  }

  /**
   * Return a sport image url
   *
   * @example
   * modules.image.sport()
   *
   * @param args.witdh image width
   * @param args.height image height
   *
   * @returns string
   */
  sport(props?: ImageProps): string {
    return this.buildUrl("sport", props);
  }

  /**
   * Return a animate avatar image url
   *
   * @example
   * modules.image.animateAvatar()
   *
   * @returns string
   */
  animatedAvatar(): string {
    const seed = this.datatypeModule.int({ min: 0, max: 1000000 });

    return `${AVATAR_HOST}?seed=${seed}`;
  }
}
