const { chaca, modules, Language } = require("../../../dist");
const { es } = require("chaca/locale/es");

modules.registerLocale(es);

module.exports = chaca.schema({
  petType: () => modules.animal.type({ language: Language.Spanish }),
  birthMonth: () => modules.date.month({ language: Language.Spanish }),
  accountType: () =>
    modules.finance.accountType({ language: Language.Spanish }),
  favoriteVerb: () => modules.word.verb({ language: Language.Spanish }),
});
