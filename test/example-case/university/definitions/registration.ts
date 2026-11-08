import { chaca, modules } from "../../../../src";
import { RegistrationStatus } from "../types";

export const REGISTRATION_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  period: () => {
    const year = modules.datatype.int({
      min: 2019,
      max: new Date().getFullYear(),
    });

    const int = chaca.utils.oneOfArray([1, 2]);

    return `${year}-${int}`;
  },
  course_id: chaca.ref("Course.id", {}),
  student_id: chaca.ref("Student.id", {
    where: async ({ refFields, currentFields, store }) => {
      let count = 0;

      const sameStudent = store
        .currentDocuments()
        .filter(
          (d) =>
            d.student_id === refFields.id && d.period === currentFields.period,
        );

      for (const d of sameStudent) {
        const course = (await store.get("Course")).find(
          (c) => c.id === d.course_id,
        );

        if (course) {
          count += course.credits;
        }
      }

      if (count > 20) {
        return false;
      }

      const documents = store.currentDocuments().filter((d) => {
        return (
          d.student_id === refFields.id &&
          d.period === currentFields.period &&
          d.course_id === currentFields.course_id
        );
      });

      return documents.length === 0;
    },
  }),
  registration_date: () => modules.date.past(),
  status: chaca.enum([
    RegistrationStatus.Active,
    RegistrationStatus.Retired,
    RegistrationStatus.Approved,
    RegistrationStatus.Failed,
  ]),
});
