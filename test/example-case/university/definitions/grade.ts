import { chaca, modules } from "../../../../src";
import { GradeStatus, RegistrationStatus } from "../types";

export const GRADE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  registration_id: chaca.ref("Registration.id", { unique: true }),
  final_grade: async ({ store, currentFields }) => {
    const registrations = await store.get("Registration");

    const found = registrations.find(
      (r) => r.id === currentFields.registration_id,
    );

    let min = 0;
    let max = 100;

    if (found.status === RegistrationStatus.Approved) {
      min = 60;
    } else if (found.status === RegistrationStatus.Failed) {
      max = 59;
    }

    return modules.datatype.float({ precision: 1, min: min, max: max });
  },
  created_at: () => modules.date.past(),
  status: chaca.enum([
    GradeStatus.Pending,
    GradeStatus.Published,
    GradeStatus.Appealed,
  ]),
});
