# University case

A university: students enroll in courses taught by teachers, get grades, pay for registrations, and borrow library books.

## Entities

| Entity         | Documents             | Description                                                        |
| -------------- | --------------------- | ------------------------------------------------------------------ |
| `User`         | 150                   | Base identity. `role` is `student` (70%), `teacher` or `admin`.    |
| `Student`      | one per student user  | Extension of `User`; always at least 16 years old. `code` is a unique sequence. |
| `Teacher`      | one per teacher user  | Extension of `User`; belongs to a `Department`. At most one dean per `School`. |
| `School`       | 20                    | Top-level academic unit.                                           |
| `Department`   | 30                    | Belongs to a `School`.                                             |
| `Program`      | 35                    | Degree program; `period_duration` between 4 and 8.                 |
| `Course`       | 100                   | 1–10 credits; taught by a `Teacher`. `code` is a unique sequence (type changed from string to number). |
| `Registration` | 120                   | A student enrolled in a course for a period (e.g. `2022-1`).       |
| `Grade`        | one per `approved`/`failed` registration | `registration_id` unique ref.               |
| `Payment`      | one per `active` registration | `amount` depends on `concept` (see below).  |
| `Book`         | 60                    | Library stock.                                                     |
| `BookLoan`     | 30                    | A student borrowing a book.                                        |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written.

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **`Student`/`Teacher` are a 1:1 extension of `User`** (`Student.id`, `Teacher.id`, `User.role`): same pattern as the ecommerce case's `Client`/`Employee`.
2. **Student** (`Student.birthdate`, `.code`, `.actual_period`, `Program.period_duration`): at least 16 years old; `code` is a unique sequence; `actual_period` never exceeds the program's `period_duration`.
3. **Teacher deanship** (`Teacher.school_dean_id`, `.status`): `null` unless the teacher is `active`; its ref rejects a school that already has a dean, so a school never has more than one. **Modeling note**: the dean stays on `Teacher.school_dean_id` rather than moving to `School.dean_id`, because that direction would close the cycle `School → Teacher → Department → School` (a department belongs to a school, a teacher to a department, and a school's dean would be a teacher), which chaca rejects with `CyclicAccessDataError`.
4. **Course** (`Course.code`, `.credits`, `.teacher_id`, `Teacher.status`): `code` is a unique sequence (not a random string); `credits` is 1–10; an active course is only taught by an `active` teacher.
5. **Registration** (`Registration.student_id`, `.course_id`, `.period`, `.registration_date`): a student never enrolls twice in the same course and period, nor exceeds 20 credits per period; `registration_date` is derived from `period` (e.g. `2022-1` falls between January and June 2022), capped at the current date.
6. **`Grade` is a 1:1 extension of terminal registrations** (`Grade.registration_id`, `Registration.status`): a unique ref to `approved`/`failed` registrations, with a matching dynamic `documents` count.
7. **`Grade` follows its registration** (`Grade.final_grade`, `.created_at`): range depends on status (`approved` ⇒ 60–100, `failed` ⇒ 0–59); `created_at` is on or after the registration's `registration_date`.
8. **`Payment` is a 1:1 extension of active registrations** (`Payment.registration_id`, `Registration.status`): a unique ref to `active` registrations, with a matching dynamic `documents` count — every active registration gets exactly one payment, never two.
9. **`Payment.amount` depends on `concept`** (`Payment.amount`, `.concept`): `registration` charges the program's cost (registration → course → program chain); `extra-course` charges the course's credits × a per-credit fee; `certificate` and `library` charge fixed fees (`definitions/fees.ts`).
10. **`BookLoan`** (`BookLoan.status`, `.book_id`, `.student_id`, `.return_date`, `.date`, `Book.count`): a book is borrowed only while its open loans (`loan`/`late`) are fewer than its `count`; a student holds at most 5 open loans; `return_date` only exists for `returned` loans, and is after the loan `date`.
