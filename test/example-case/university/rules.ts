import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import {
  BookLoanStatus,
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
      for (const registration of Registration) {
        const grade = Grade.find((candidate) => {
          return candidate.registration_id === registration.id;
        });

        expect(grade).toBeDefined();

        if (grade !== undefined) {
          if (registration.status === RegistrationStatus.Approved) {
            expect(grade.final_grade).toBeGreaterThanOrEqual(60);
            expect(grade.final_grade).toBeLessThanOrEqual(100);
          } else if (registration.status === RegistrationStatus.Failed) {
            expect(grade.final_grade).toBeGreaterThanOrEqual(0);
            expect(grade.final_grade).toBeLessThanOrEqual(59);
          } else {
            expect(grade.final_grade).toBeGreaterThanOrEqual(0);
            expect(grade.final_grade).toBeLessThanOrEqual(100);
          }
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
    text: "A payment's amount equals the cost of its registration's program",
    fields: [
      "Payment.amount",
      "Payment.registration_id",
      "Registration.course_id",
      "Course.program_id",
      "Program.cost",
    ],
    check: ({ Payment, Registration, Course, Program }) => {
      for (const payment of Payment) {
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
    text: "Only books with stock can be loaned",
    fields: ["BookLoan.book_id", "Book.count"],
    check: ({ BookLoan, Book }) => {
      for (const loan of BookLoan) {
        const book = FindRef.execute({
          documents: Book,
          id: loan.book_id,
          from: "BookLoan.book_id",
        });

        expect(book.count).toBeGreaterThan(0);
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
    text: "A teacher has a school_dean_id exactly when their status is 'active'",
    fields: ["Teacher.status", "Teacher.school_dean_id"],
    check: ({ Teacher }) => {
      for (const teacher of Teacher) {
        if (teacher.status !== TeacherStatus.Active) {
          expect(teacher.school_dean_id).toBeNull();
        } else {
          expect(teacher.school_dean_id).not.toBeNull();
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
];
