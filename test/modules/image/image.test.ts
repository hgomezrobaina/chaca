import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

type ImageMethod =
  | "food"
  | "event"
  | "wallpaper"
  | "threeDimension"
  | "architecture"
  | "nature"
  | "fashion"
  | "film"
  | "people"
  | "health"
  | "street"
  | "animal"
  | "spiritual"
  | "travel"
  | "art"
  | "history"
  | "sport"
  | "house";

interface ParsedImageUrl {
  url: URL;
  width: number;
  height: number;
  tags: string;
}

/**
 * loremflickr urls carry the size and tags in the path (`/<width>/<height>/<tags>`),
 * so the path is parsed instead of read from query params.
 */
function parseImageUrl(value: string): ParsedImageUrl {
  const url = new URL(value);

  expect(url.protocol).toBe("https:");
  expect(url.host).toBe("loremflickr.com");

  const segments = url.pathname.slice(1).split("/");

  expect(segments).toHaveLength(3);

  const [rawWidth, rawHeight, tags] = segments;

  return {
    url: url,
    width: Number(rawWidth),
    height: Number(rawHeight),
    tags: tags,
  };
}

function expectSizeInRange(size: number): void {
  expect(Number.isInteger(size)).toBe(true);
  expect(size).toBeGreaterThanOrEqual(640);
  expect(size).toBeLessThanOrEqual(4000);
}

describe("image modules", () => {
  it.each<[method: ImageMethod, category: string]>([
    ["food", "food"],
    ["event", "event"],
    ["wallpaper", "wallpaper"],
    ["threeDimension", "3d"],
    ["architecture", "architecture"],
    ["nature", "nature"],
    ["fashion", "fashion"],
    ["film", "film"],
    ["people", "people"],
    ["health", "health"],
    ["street", "street"],
    ["animal", "animal"],
    ["spiritual", "spiritual"],
    ["travel", "travel"],
    ["art", "art"],
    ["history", "history"],
    ["sport", "sport"],
    ["house", "house"],
  ])(
    "image.%s. Should return a loremflickr url tagged '%s' with sizes in [640, 4000]",
    (method, category) => {
      const { tags, width, height } = parseImageUrl(modules.image[method]());

      expect(tags).toBe(category);
      expectSizeInRange(width);
      expectSizeInRange(height);
    },
  );

  it("image.food with width = 800 and height = 600. Should keep the tag and use the given sizes", () => {
    const { tags, width, height } = parseImageUrl(
      modules.image.food({ width: 800, height: 600 }),
    );

    expect(tags).toBe("food");
    expect(width).toBe(800);
    expect(height).toBe(600);
  });

  it("image.food. Should pin the image with a lock so the url is stable", () => {
    const { url } = parseImageUrl(modules.image.food());

    const lock = Number(url.searchParams.get("lock"));

    expect(Number.isInteger(lock)).toBe(true);
    expect(lock).toBeGreaterThanOrEqual(1);
  });

  it("image.category with category = 'soccer'. Should return a url tagged 'soccer'", () => {
    const { tags } = parseImageUrl(
      modules.image.category({ category: "soccer" }),
    );

    expect(tags).toBe("soccer");
  });

  it("image.category with no arguments. Should return a url with a non-empty tag", () => {
    const { tags } = parseImageUrl(modules.image.category());

    expect(tags).not.toBe("");
  });

  it.each<[category: string, expected: string]>([
    ["sports car", "sports,car"],
    ["  Sports   Car  ", "sports,car"],
    ["red,blue", "red,blue"],
    ["3d", "3d"],
  ])(
    "image.category with category = '%s'. Should build the tags as '%s'",
    (category, expected) => {
      const { tags } = parseImageUrl(modules.image.category({ category }));

      expect(tags).toBe(expected);
    },
  );

  it("image.category with an accented category. Should percent-encode it", () => {
    const { tags } = parseImageUrl(
      modules.image.category({ category: "café" }),
    );

    expect(tags).toBe(encodeURIComponent("café"));
  });

  it("image.category with a category with no usable characters. Should fall back to a valid tag", () => {
    const { tags } = parseImageUrl(modules.image.category({ category: "!!!" }));

    expect(tags).toBe("nature");
  });

  it("image.food with a zero width. Should clamp the size so the url stays valid", () => {
    const { width } = parseImageUrl(modules.image.food({ width: 0 }));

    expect(width).toBe(1);
  });

  it("image.animatedAvatar. Should return a dicebear svg url with a seed", () => {
    const url = new URL(modules.image.animatedAvatar());

    expect(url.host).toBe("api.dicebear.com");
    expect(url.pathname).toBe("/9.x/adventurer/svg");
    expect(Number.isInteger(Number(url.searchParams.get("seed")))).toBe(true);
  });

  it("every image method. Should build a url with no whitespace left in the path", () => {
    const values = [
      modules.image.category({ category: "sports car" }),
      modules.image.food(),
      modules.image.animatedAvatar(),
    ];

    for (const value of values) {
      expect(value).not.toMatch(/\s/);
      expect(value).not.toContain("%20");
    }
  });
});
