import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { StudentStatus, UserRole } from "../types";

export const STUDENT_SCHEMA = chaca.schema({
  id: chaca.key(
    chaca.ref("User.id", {
      unique: true,
      where: ({ refFields }) => {
        return refFields.role === UserRole.Student;
      },
    }),
  ),
  code: () => chaca.utils.replaceSymbols("######"),
  birthdate: () => modules.date.birthdate({ mode: "age", min: 16 }),
  country: () => modules.address.country(),
  program_id: chaca.ref("Program.id"),
  status: chaca.enum([
    StudentStatus.Active,
    StudentStatus.Suspend,
    StudentStatus.Init,
    StudentStatus.Graduated,
  ]),
  actual_period: async ({ store, currentFields }) => {
    const programs = await store.get("Program");
    const program = FindRef.execute({
      documents: programs,
      id: currentFields.program_id,
      from: "Student.program_id",
    });

    return modules.datatype.int({ min: 0, max: program.period_duration });
  },
});
