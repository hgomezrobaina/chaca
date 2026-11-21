import { chaca, modules } from "../../../../src";

const AIRLINE_CODES = ["AA", "DL", "UA", "WN", "AS", "B6", "NK", "F9"];

export const AIRLINE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.word.noun(),
  code: chaca.sequential(AIRLINE_CODES),
  founded_at: () => modules.date.past({ years: 50 }),
});
