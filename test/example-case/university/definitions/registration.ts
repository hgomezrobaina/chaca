import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
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
        const course = FindRef.execute({
          documents: await store.get("Course"),
          id: d.course_id,
          from: "Registration.course_id",
        });

        count += course.credits;
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
  registration_date: ({ currentFields }) => {
    const [yearText, halfText] = currentFields.period.split("-");
    const year = Number(yearText);
    const half = Number(halfText);

    const rangeStart = half === 1 ? new Date(year, 0, 1) : new Date(year, 6, 1);
    const rangeEnd =
      half === 1 ? new Date(year, 5, 30) : new Date(year, 11, 31);
    const now = new Date();
    const to = rangeEnd < now ? rangeEnd : now;
    const from = rangeStart < to ? rangeStart : to;

    return modules.date.between({ from, to });
  },
  status: chaca.enum([
    RegistrationStatus.Active,
    RegistrationStatus.Retired,
    RegistrationStatus.Approved,
    RegistrationStatus.Failed,
  ]),
});
