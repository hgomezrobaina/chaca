import { Language, modules } from "../../../src";
import { es } from "../../../src/locales/es";
import { beforeAll, describe, expect, it } from "vitest";

function expectNames({
  firstNames,
  lastNames,
  value,
}: {
  firstNames: Array<string>;
  lastNames: Array<string>;
  value: string;
}) {
  const sep = value.split(" ");

  if (sep.length === 4) {
    const [firstName, middleName, lastName1, lastName2] = sep;

    expect(firstNames.includes(firstName)).toBe(true);
    expect(firstNames.includes(middleName)).toBe(true);
    expect(lastNames.includes(lastName1)).toBe(true);
    expect(lastNames.includes(lastName2)).toBe(true);
  } else {
    const [firstName, lastName1, lastName2] = sep;

    expect(firstNames.includes(firstName)).toBe(true);
    expect(lastNames.includes(lastName1)).toBe(true);
    expect(lastNames.includes(lastName2)).toBe(true);
  }
}

describe("person.fullName", () => {
  beforeAll(() => {
    modules.registerLocale(es);
  });

  it("no arguments. should return a english full name", () => {
    const value = modules.person.fullName();
    const constants = modules.person.constants;
    const allNames = [...constants.names.en.female, ...constants.names.en.male];

    expectNames({
      value,
      firstNames: allNames,
      lastNames: constants.names.en.lastNames,
    });
  });

  describe("language argument", () => {
    it("language = 'es'. should return an spanish full name", () => {
      const value = modules.person.fullName({ language: Language.Spanish });
      const constants = modules.person.constants;
      const allNames = [
        ...constants.names.es.female,
        ...constants.names.es.male,
      ];

      expectNames({
        value,
        firstNames: allNames,
        lastNames: constants.names.es.lastNames,
      });
    });

    it("language = 'en'. should return an english full name", () => {
      const value = modules.person.fullName({ language: Language.English });
      const constants = modules.person.constants;
      const allNames = [
        ...constants.names.en.female,
        ...constants.names.en.male,
      ];

      expectNames({
        value,
        firstNames: allNames,
        lastNames: constants.names.en.lastNames,
      });
    });
  });

  describe("sex argument", () => {
    it("sex = 'male'. should return an male english full name", () => {
      const value = modules.person.fullName({ sex: "male" });
      const constants = modules.person.constants;
      const allNames = constants.names.en.male;

      expectNames({
        value,
        firstNames: allNames,
        lastNames: constants.names.en.lastNames,
      });
    });
  });

  describe("sex and language argument", () => {
    it("sex = 'male' and language = 'spanish'. should return an male spanish full name", () => {
      const value = modules.person.fullName({
        sex: "male",
        language: Language.Spanish,
      });
      const constants = modules.person.constants;
      const allNames = constants.names.es.male;

      expectNames({
        value,
        firstNames: allNames,
        lastNames: constants.names.es.lastNames,
      });
    });
  });
});
