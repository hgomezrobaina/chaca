import { DatasetSchema } from "../../../../src";
import { UserRole } from "../types";
import { BOOK_SCHEMA } from "./book";
import { BOOK_LOAN } from "./book-loan";
import { COURSE_SCHEMA } from "./course";
import { DEPARTMENT_SCHEMA } from "./department";
import { GRADE_SCHEMA } from "./grade";
import { PAYMENT_SCHEMA } from "./payment";
import { PROGRAM_SCHEMA } from "./program";
import { REGISTRATION_SCHEMA } from "./registration";
import { SCHOOL_SCHEMA } from "./school";
import { STUDENT_SCHEMA } from "./student";
import { TEACHER_SCHEMA } from "./teacher";
import { USER_SCHEMA } from "./user";

export const UNIVERSITY_SCHEMAS: DatasetSchema[] = [
  { documents: 30, name: "BookLoan", schema: BOOK_LOAN },
  { documents: 60, name: "Book", schema: BOOK_SCHEMA },
  { documents: 100, name: "Course", schema: COURSE_SCHEMA },
  { documents: 30, name: "Department", schema: DEPARTMENT_SCHEMA },
  { documents: 120, name: "Grade", schema: GRADE_SCHEMA },
  { documents: 200, name: "Payment", schema: PAYMENT_SCHEMA },
  { documents: 35, name: "Program", schema: PROGRAM_SCHEMA },
  { documents: 120, name: "Registration", schema: REGISTRATION_SCHEMA },
  { documents: 20, name: "School", schema: SCHOOL_SCHEMA },
  {
    documents: async ({ store }) => {
      const users = await store.get("User");

      return users.filter((u) => u.role === UserRole.Student).length;
    },
    name: "Student",
    schema: STUDENT_SCHEMA,
  },
  {
    documents: async ({ store }) => {
      const users = await store.get("User");

      return users.filter((u) => u.role === UserRole.Teacher).length;
    },
    name: "Teacher",
    schema: TEACHER_SCHEMA,
  },
  { documents: 150, name: "User", schema: USER_SCHEMA },
];
