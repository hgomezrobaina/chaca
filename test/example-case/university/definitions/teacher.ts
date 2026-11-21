import { chaca, modules } from "../../../../src";
import { TeacherStatus, TeacherTitle, UserRole } from "../types";

export const TEACHER_SCHEMA = chaca.schema({
  id: chaca.key(
    chaca.ref("User.id", {
      unique: true,
      where: ({ refFields }) => {
        return refFields.role === UserRole.Teacher;
      },
    }),
  ),
  department_id: chaca.ref("Department.id"),
  title: chaca.probability([
    { value: TeacherTitle.Graduate, chance: 0.7 },
    { value: TeacherTitle.Mastery, chance: 0.4 },
    { value: TeacherTitle.Phd, chance: 0.2 },
  ]),
  employment_date: () => modules.date.past(),
  salary: () => modules.datatype.int({ min: 1000, max: 10000 }),
  status: chaca.enum([
    TeacherStatus.Active,
    TeacherStatus.Licence,
    TeacherStatus.Retired,
  ]),
  school_dean_id: {
    type: chaca.ref("School.id", {
      nullOnEmpty: true,
      where: ({ refFields, store }) => {
        const alreadyHasDean = store.currentDocuments().some((teacher) => {
          return teacher.school_dean_id === refFields.id;
        });

        return !alreadyHasDean;
      },
    }),
    possibleNull: ({ currentFields }) => {
      return currentFields.status !== TeacherStatus.Active;
    },
  },
});
