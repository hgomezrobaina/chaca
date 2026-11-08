import { afterEach, describe, expect, it, vi } from "vitest";
import { ChacaModules, ChacaUtils, Language } from "../../src";

/**
 * `Language.Spanish` requested without registering `es`: the module rule
 * (requirements.md HU-1 c4) is a silent fallback to `en`, never an error and
 * never a console write.
 */
describe("language requested without its locale registered", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to English silently, with no console output", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const modules = new ChacaModules(new ChacaUtils());

    expect(() => {
      modules.word.noun({ language: Language.Spanish });
    }).not.toThrow();

    expect(modules.word.constants.words.en.nouns).include(
      modules.word.noun({ language: Language.Spanish }),
    );
    expect(modules.person.constants.names.en.lastNames).include(
      modules.person.lastName({ language: Language.Spanish }),
    );

    expect(warn).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
