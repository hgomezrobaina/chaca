import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import {
  CERTIFICATE_FEE,
  EXTRA_COURSE_FEE_PER_CREDIT,
  LIBRARY_FINE,
} from "./definitions/fees";
import {
  BookLoanStatus,
  PaymentConcept,
  PaymentStatus,
  RegistrationStatus,
  TeacherStatus,
  UniversityDataset,
  UserRole,
} from "./types";

const calculateAge = (birthdate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }

  return age;
};

export const UNIVERSITY_RULES: CaseRule<UniversityDataset>[] = [
  {
    id: "R1",
    text: "Every grade's registration_id resolves to exactly one registration",
    fields: ["Grade.registration_id", "Registration.id"],
    check: ({ Grade, Registration }) => {
      for (const grade of Grade) {
        const found = Registration.filter((registration) => {
          return registration.id === grade.registration_id;
        });

        expect(found).toHaveLength(1);
      }
    },
  },
  {
    id: "R2",
    text: "A registration cannot have more than one grade",
    fields: ["Grade.registration_id"],
    check: ({ Grade }) => {
      for (const grade of Grade) {
        const sameRegistration = Grade.filter((candidate) => {
          return candidate.registration_id === grade.registration_id;
        });

        expect(sameRegistration).toHaveLength(1);
      }
    },
  },
  {
    id: "R3",
    text: "A grade's final_grade range matches its registration's status (approved => 60-100, failed => 0-59)",
    fields: [
      "Registration.status",
      "Grade.registration_id",
      "Grade.final_grade",
    ],
    check: ({ Registration, Grade }) => {
      for (const grade of Grade) {
        const registration = FindRef.execute({
          documents: Registration,
          id: grade.registration_id,
          from: "Grade.registration_id",
        });

        if (registration.status === RegistrationStatus.Approved) {
          expect(grade.final_grade).toBeGreaterThanOrEqual(60);
          expect(grade.final_grade).toBeLessThanOrEqual(100);
        } else {
          expect(registration.status).toBe(RegistrationStatus.Failed);
          expect(grade.final_grade).toBeGreaterThanOrEqual(0);
          expect(grade.final_grade).toBeLessThanOrEqual(59);
        }
      }
    },
  },
  {
    id: "R4",
    text: "A student cannot be registered more than once in the same course and period",
    fields: [
      "Registration.student_id",
      "Registration.course_id",
      "Registration.period",
    ],
    check: ({ Registration }) => {
      for (const registration of Registration) {
        const found = Registration.filter((candidate) => {
          return (
            candidate.student_id === registration.student_id &&
            candidate.course_id === registration.course_id &&
            candidate.period === registration.period
          );
        });

        expect(found).toHaveLength(1);
      }
    },
  },
  {
    id: "R5",
    text: "A student cannot exceed 20 credits per period",
    fields: [
      "Registration.student_id",
      "Registration.period",
      "Registration.course_id",
      "Course.credits",
    ],
    check: ({ Registration, Course }) => {
      const credits = new Map<string, number>();

      for (const registration of Registration) {
        const course = FindRef.execute({
          documents: Course,
          id: registration.course_id,
          from: "Registration.course_id",
        });

        const key = `${registration.student_id}-${registration.period}`;
        credits.set(key, (credits.get(key) ?? 0) + course.credits);
      }

      for (const total of credits.values()) {
        expect(total).toBeLessThanOrEqual(20);
      }
    },
  },
  {
    id: "R6",
    text: "Every payment references an active registration",
    fields: ["Payment.registration_id", "Registration.status"],
    check: ({ Payment, Registration }) => {
      for (const payment of Payment) {
        const registration = FindRef.execute({
          documents: Registration,
          id: payment.registration_id,
          from: "Payment.registration_id",
        });

        expect(registration.status).toBe(RegistrationStatus.Active);
      }
    },
  },
  {
    id: "R7",
    text: "A payment's amount matches its concept: program cost, credits x fee, or a fixed fee",
    fields: [
      "Payment.amount",
      "Payment.concept",
      "Payment.registration_id",
      "Registration.course_id",
      "Course.credits",
      "Course.program_id",
      "Program.cost",
    ],
    check: ({ Payment, Registration, Course, Program }) => {
      for (const payment of Payment) {
        if (payment.concept === PaymentConcept.Certificate) {
          expect(payment.amount).toBe(CERTIFICATE_FEE);
          continue;
        }

        if (payment.concept === PaymentConcept.Library) {
          expect(payment.amount).toBe(LIBRARY_FINE);
          continue;
        }

        const registration = FindRef.execute({
          documents: Registration,
          id: payment.registration_id,
          from: "Payment.registration_id",
        });
        const course = FindRef.execute({
          documents: Course,
          id: registration.course_id,
          from: "Registration.course_id",
        });

        if (payment.concept === PaymentConcept.ExtraCourse) {
          expect(payment.amount).toBe(
            course.credits * EXTRA_COURSE_FEE_PER_CREDIT,
          );
          continue;
        }

        const program = FindRef.execute({
          documents: Program,
          id: course.program_id,
          from: "Course.program_id",
        });

        expect(payment.amount).toBe(program.cost);
      }
    },
  },
  {
    id: "R8",
    text: "Not every payment is failed",
    fields: ["Payment.status"],
    check: ({ Payment }) => {
      const nonFailed = Payment.filter((payment) => {
        return payment.status !== PaymentStatus.Failed;
      });

      expect(nonFailed.length).toBeGreaterThan(0);
    },
  },
  {
    id: "R9",
    text: "A registration can have at most one non-failed payment",
    fields: ["Payment.registration_id", "Payment.status"],
    check: ({ Payment }) => {
      for (const payment of Payment) {
        const nonFailed = Payment.filter((candidate) => {
          return (
            candidate.registration_id === payment.registration_id &&
            candidate.status !== PaymentStatus.Failed
          );
        });

        expect(nonFailed.length).toBeLessThanOrEqual(1);
      }
    },
  },
  {
    id: "R10",
    text: "A course's credits are between 1 and 10",
    fields: ["Course.credits"],
    check: ({ Course }) => {
      for (const course of Course) {
        expect(course.credits).toBeGreaterThanOrEqual(1);
        expect(course.credits).toBeLessThanOrEqual(10);
      }
    },
  },
  {
    id: "R11",
    text: "An active course can only be taught by an active teacher",
    fields: ["Course.active", "Course.teacher_id", "Teacher.status"],
    check: ({ Course, Teacher }) => {
      for (const course of Course) {
        if (course.active) {
          const teacher = FindRef.execute({
            documents: Teacher,
            id: course.teacher_id,
            from: "Course.teacher_id",
          });

          expect(teacher.status).toBe(TeacherStatus.Active);
        }
      }
    },
  },
  {
    id: "R12",
    text: "A book's count is never negative",
    fields: ["Book.count"],
    check: ({ Book }) => {
      for (const book of Book) {
        expect(book.count).toBeGreaterThanOrEqual(0);
      }
    },
  },
  {
    id: "R13",
    text: "The number of open loans of a book never exceeds its count",
    fields: ["BookLoan.book_id", "BookLoan.status", "Book.count"],
    check: ({ BookLoan, Book }) => {
      for (const book of Book) {
        const openLoans = BookLoan.filter((loan) => {
          return (
            loan.book_id === book.id &&
            (loan.status === BookLoanStatus.Loan ||
              loan.status === BookLoanStatus.Late)
          );
        });

        expect(openLoans.length).toBeLessThanOrEqual(book.count);
      }
    },
  },
  {
    id: "R14",
    text: "A student can have at most 5 open book loans",
    fields: ["BookLoan.student_id", "BookLoan.status"],
    check: ({ Student, BookLoan }) => {
      for (const student of Student) {
        const openLoans = BookLoan.filter((loan) => {
          return (
            loan.student_id === student.id &&
            (loan.status === BookLoanStatus.Loan ||
              loan.status === BookLoanStatus.Late)
          );
        });

        expect(openLoans.length).toBeLessThanOrEqual(5);
      }
    },
  },
  {
    id: "R15",
    text: "A returned book loan's return_date is after its date",
    fields: ["BookLoan.status", "BookLoan.return_date", "BookLoan.date"],
    check: ({ BookLoan }) => {
      for (const loan of BookLoan) {
        if (loan.return_date !== null) {
          expect(loan.status).toBe(BookLoanStatus.Returned);
          expect(loan.return_date.getTime()).toBeGreaterThan(
            loan.date.getTime(),
          );
        }
      }
    },
  },
  {
    id: "R16",
    text: "The number of teachers equals the number of users with role 'teacher'",
    fields: ["Teacher.id", "User.role"],
    check: ({ User, Teacher }) => {
      const teacherUsers = User.filter((user) => {
        return user.role === UserRole.Teacher;
      });

      expect(teacherUsers).toHaveLength(Teacher.length);
    },
  },
  {
    id: "R17",
    text: "A teacher who is not 'active' never has a school_dean_id",
    fields: ["Teacher.status", "Teacher.school_dean_id"],
    check: ({ Teacher }) => {
      for (const teacher of Teacher) {
        if (teacher.status !== TeacherStatus.Active) {
          expect(teacher.school_dean_id).toBeNull();
        }
      }
    },
  },
  {
    id: "R18",
    text: "A program's period_duration is between 4 and 8",
    fields: ["Program.period_duration"],
    check: ({ Program }) => {
      for (const program of Program) {
        expect(program.period_duration).toBeGreaterThanOrEqual(4);
        expect(program.period_duration).toBeLessThanOrEqual(8);
      }
    },
  },
  {
    id: "R19",
    text: "The number of students equals the number of users with role 'student'",
    fields: ["Student.id", "User.role"],
    check: ({ User, Student }) => {
      const studentUsers = User.filter((user) => {
        return user.role === UserRole.Student;
      });

      expect(studentUsers).toHaveLength(Student.length);
    },
  },
  {
    id: "R20",
    text: "A student's actual_period never exceeds their program's period_duration",
    fields: [
      "Student.actual_period",
      "Student.program_id",
      "Program.period_duration",
    ],
    check: ({ Student, Program }) => {
      for (const student of Student) {
        const program = FindRef.execute({
          documents: Program,
          id: student.program_id,
          from: "Student.program_id",
        });

        expect(student.actual_period).toBeGreaterThanOrEqual(0);
        expect(student.actual_period).toBeLessThanOrEqual(
          program.period_duration,
        );
      }
    },
  },
  {
    id: "R21",
    text: "Every student is at least 16 years old",
    fields: ["Student.birthdate"],
    check: ({ Student }) => {
      for (const student of Student) {
        const age = calculateAge(student.birthdate);

        expect(age).toBeGreaterThanOrEqual(16);
      }
    },
  },
  {
    id: "R22",
    text: "A school's name is never empty",
    fields: ["School.name"],
    check: ({ School }) => {
      for (const school of School) {
        expect(school.name.length).toBeGreaterThan(0);
      }
    },
  },
  {
    id: "R23",
    text: "A department's school_id references an existing school",
    fields: ["Department.school_id", "School.id"],
    check: ({ Department, School }) => {
      for (const department of Department) {
        FindRef.execute({
          documents: School,
          id: department.school_id,
          from: "Department.school_id",
        });
      }
    },
  },
  {
    id: "R24",
    text: "Every course's code is unique",
    fields: ["Course.code"],
    check: ({ Course }) => {
      const codes = Course.map((course) => course.code);

      expect(new Set(codes).size).toBe(codes.length);
    },
  },
  {
    id: "R25",
    text: "Every student's code is unique",
    fields: ["Student.code"],
    check: ({ Student }) => {
      const codes = Student.map((student) => student.code);

      expect(new Set(codes).size).toBe(codes.length);
    },
  },
  {
    id: "R26",
    text: "Only 'approved' or 'failed' registrations have a grade",
    fields: ["Grade.registration_id", "Registration.status"],
    check: ({ Grade, Registration }) => {
      for (const grade of Grade) {
        const registration = FindRef.execute({
          documents: Registration,
          id: grade.registration_id,
          from: "Grade.registration_id",
        });

        expect([
          RegistrationStatus.Approved,
          RegistrationStatus.Failed,
        ]).toContain(registration.status);
      }
    },
  },
  {
    id: "R27",
    text: "A grade's created_at is on or after its registration's registration_date",
    fields: [
      "Grade.created_at",
      "Grade.registration_id",
      "Registration.registration_date",
    ],
    check: ({ Grade, Registration }) => {
      for (const grade of Grade) {
        const registration = FindRef.execute({
          documents: Registration,
          id: grade.registration_id,
          from: "Grade.registration_id",
        });

        expect(grade.created_at.getTime()).toBeGreaterThanOrEqual(
          registration.registration_date.getTime(),
        );
      }
    },
  },
  {
    id: "R28",
    text: "A registration's registration_date falls within the half-year named by its period, and is never in the future",
    fields: ["Registration.period", "Registration.registration_date"],
    check: ({ Registration }) => {
      const now = new Date();

      for (const registration of Registration) {
        const [yearText, halfText] = registration.period.split("-");
        const year = Number(yearText);
        const half = Number(halfText);
        const rangeStart =
          half === 1 ? new Date(year, 0, 1) : new Date(year, 6, 1);
        const rangeEnd =
          half === 1 ? new Date(year, 5, 30) : new Date(year, 11, 31);
        const to = rangeEnd < now ? rangeEnd : now;
        const from = rangeStart < to ? rangeStart : to;

        expect(registration.registration_date.getTime()).toBeGreaterThanOrEqual(
          from.getTime(),
        );
        expect(registration.registration_date.getTime()).toBeLessThanOrEqual(
          to.getTime(),
        );
      }
    },
  },
  {
    id: "R29",
    text: "The number of grades equals the number of 'approved' or 'failed' registrations",
    fields: ["Grade.id", "Registration.status"],
    check: ({ Grade, Registration }) => {
      const terminal = Registration.filter((registration) => {
        return (
          registration.status === RegistrationStatus.Approved ||
          registration.status === RegistrationStatus.Failed
        );
      });

      expect(Grade.length).toBe(terminal.length);
    },
  },
  {
    id: "R30",
    text: "Every active registration has exactly one payment, and non-active registrations have none",
    fields: ["Payment.registration_id", "Registration.status"],
    check: ({ Payment, Registration }) => {
      for (const registration of Registration) {
        const payments = Payment.filter((payment) => {
          return payment.registration_id === registration.id;
        });

        if (registration.status === RegistrationStatus.Active) {
          expect(payments).toHaveLength(1);
        } else {
          expect(payments).toHaveLength(0);
        }
      }
    },
  },
  {
    id: "R31",
    text: "A school has at most one dean",
    fields: ["Teacher.school_dean_id"],
    check: ({ Teacher }) => {
      const deanSchoolIds = Teacher.map(
        (teacher) => teacher.school_dean_id,
      ).filter((schoolId): schoolId is string => schoolId !== null);

      expect(new Set(deanSchoolIds).size).toBe(deanSchoolIds.length);
    },
  },
  {
    id: "R32",
    text: "A student's actual_period is always a defined integer",
    fields: ["Student.actual_period"],
    check: ({ Student }) => {
      for (const student of Student) {
        expect(Number.isInteger(student.actual_period)).toBe(true);
      }
    },
  },
];
