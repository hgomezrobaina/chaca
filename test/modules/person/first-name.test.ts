import { Language, modules } from "../../../src";
import { es } from "../../../src/locales/es";
import { beforeAll, describe, expect, it } from "vitest";

describe("person.firstName", () => {
  beforeAll(() => {
    modules.registerLocale(es);
  });

  it("no arguments. should return one of the defined english first names", () => {
    const value = modules.person.firstName();

    const constants = modules.person.constants;
    const allNames = [...constants.names.en.female, ...constants.names.en.male];
    const is = allNames.includes(value);
    expect(is).toBe(true);
  });

  describe("language argument", () => {
    it("language = 'es'. should return an spanish first name", () => {
      const value = modules.person.firstName({ language: Language.Spanish });

      const constants = modules.person.constants;
      const allNames = [
        ...constants.names.es!.female,
        ...constants.names.es!.male,
      ];
      const is = allNames.includes(value);
      expect(is).toBe(true);
    });

    it("language = 'en'. should return an english first name", () => {
      const value = modules.person.firstName({ language: Language.English });

      const constants = modules.person.constants;
      const allNames = [
        ...constants.names.en.female,
        ...constants.names.en.male,
      ];
      const is = allNames.includes(value);
      expect(is).toBe(true);
    });
  });

  describe("sex argument", () => {
    it("sex = 'male'. should return a english male first name", () => {
      const value = modules.person.firstName({ sex: "male" });
      const is = modules.person.constants.names.en.male.includes(value);
      expect(is).toBe(true);
    });

    it("sex = 'female'. should return a english female first name", () => {
      const value = modules.person.firstName({ sex: "female" });
      const is = modules.person.constants.names.en.female.includes(value);
      expect(is).toBe(true);
    });
  });

  describe("sex and language argument", () => {
    it("sex = 'male' & language = 'es'. should return a male spanish first name", () => {
      const value = modules.person.firstName({
        sex: "male",
        language: Language.Spanish,
      });
      const is = modules.person.constants.names.es!.male.includes(value);
      expect(is).toBe(true);
    });
  });
});
