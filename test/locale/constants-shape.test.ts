import { beforeAll, describe, expect, it } from "vitest";
import { ChacaModules, ChacaUtils } from "../../src";
import { es } from "../../src/locales/es";

describe("modules.<module>.constants keeps its pre-locale shape", () => {
  let modules: ChacaModules;

  beforeAll(() => {
    modules = new ChacaModules(new ChacaUtils());
    modules.registerLocale(es);
  });

  it("word.constants.words exposes one key per registered locale, same shape as before", () => {
    expect(modules.word.constants.words.en.nouns.length).toBeGreaterThan(0);
    expect(modules.word.constants.words.es!.nouns).toEqual(es.word.nouns);
  });

  it("person.constants.names exposes one key per registered locale, same shape as before", () => {
    expect(modules.person.constants.names.en.female.length).toBeGreaterThan(0);
    expect(modules.person.constants.names.es!.female).toEqual(es.person.female);
    expect(modules.person.constants.names.es!.male).toEqual(es.person.male);
    expect(modules.person.constants.names.es!.lastNames).toEqual(
      es.person.lastNames,
    );
  });

  it("a locale that was never registered has no key at all", () => {
    const unregistered = new ChacaModules(new ChacaUtils());

    expect(unregistered.word.constants.words.es).toBeUndefined();
    expect(unregistered.person.constants.names.es).toBeUndefined();
  });
});
