import { chaca, modules } from "../../../../src";
import { EmployeeDepartment, UserRole } from "../types";

export const EMPLOYEE_SCHEMA = chaca.schema({
  id: chaca.key(
    chaca.ref("User.id", {
      unique: true,
      where: ({ refFields }) => {
        return refFields.role === UserRole.Employee;
      },
    }),
  ),
  department: chaca.enum([
    EmployeeDepartment.Sells,
    EmployeeDepartment.Support,
    EmployeeDepartment.Logistic,
    EmployeeDepartment.Finance,
  ]),
  charge: () => modules.word.noun(),
  salary: () => modules.datatype.float({ precision: 2, min: 1000, max: 6000 }),
  init_date: () => modules.date.past(),
});
