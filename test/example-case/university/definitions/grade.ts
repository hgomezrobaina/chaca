import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { GradeStatus, RegistrationStatus } from "../types";

export const GRADE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  registration_id: chaca.ref("Registration.id", { unique: true }),
  final_grade: async ({ store, currentFields }) => {
    const registrations = await store.get("Registration");

    const registration = FindRef.execute({
      documents: registrations,
      id: currentFields.registration_id,
      from: "Grade.registration_id",
    });

    let min = 0;
    let max = 100;

    if (registration.status === RegistrationStatus.Approved) {
      min = 60;
    } else if (registration.status === RegistrationStatus.Failed) {
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
