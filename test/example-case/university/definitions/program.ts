import { chaca, modules } from "../../../../src";
import { ProgramLevel } from "../types";

export const PROGRAM_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: () => modules.word.noun(),
  level: chaca.enum([ProgramLevel.Undergraduate, ProgramLevel.Postgraduate]),
  department_id: chaca.ref("Department.id"),
  period_duration: () => modules.datatype.int({ min: 4, max: 8 }),
  cost: () => modules.datatype.float({ precision: 2, min: 1, max: 1000 }),
});
