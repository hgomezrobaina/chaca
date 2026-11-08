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

## Business rules encoded in the schemas

- **Student/Teacher counts follow User roles**: same 1:1 "table inheritance" pattern as the ecommerce case.
- **Student**: `birthdate` guarantees a minimum age of 16, `code` is a unique sequence, and `actual_period` never exceeds the program's `period_duration`.
- **Teacher**: `school_dean_id` is `null` unless the teacher is `active`, and a `where` on the ref rejects any school that already has a dean — a school has at most one. **Modeling note**: the dean stays on `Teacher.school_dean_id` rather than moving to `School.dean_id`, because that direction would create the cycle `School → Teacher → Department → School` (a department belongs to a school, a teacher to a department, and a school's dean would be a teacher), which chaca rejects with `CyclicAccessDataError`.
- **Course**: `code` is a unique sequence (not a random string); an active course can only be taught by an `active` teacher.
- **Registration**: a student cannot enroll twice in the same course and period, cannot exceed 20 credits per period, and `registration_date` is derived from `period` (e.g. `2022-1` falls between January and June 2022), capped at the current date.
- **Grade**: only exists for `approved`/`failed` registrations (`documents` counts them dynamically), `created_at` is on or after the registration's `registration_date`, and `final_grade` range depends on the registration status — `approved` ⇒ 60–100, `failed` ⇒ 0–59.
- **Payment**: `registration_id` is a unique ref to `active` registrations, with a matching dynamic `documents` count — every active registration gets exactly one payment, never two. `amount` depends on `concept`: `registration` charges the program's cost (via the registration → course → program chain), `extra-course` charges the course's credits × a per-credit fee, `certificate` and `library` charge fixed fees (`definitions/fees.ts`).
- **BookLoan**: `status` is generated before `book_id` so the stock check can use it; a book can be borrowed only while its open loans (`loan`/`late`) are fewer than its `count`; a student can hold at most 5 open loans; `return_date` only exists for `returned` loans and is always after the loan `date`.

## Validations (in [university.test.ts](university.test.ts))

- Every active/approved/failed registration has exactly one grade or payment as appropriate, and a registration never has more than one of either.
- Grade ranges match the registration status (`approved` ⇒ ≥ 60, `failed` ⇒ ≤ 59), and only `approved`/`failed` registrations have a grade.
- `Grade.created_at` is on or after its registration's `registration_date`.
- `Registration.registration_date` falls within the half-year its `period` names.
- `Course.code` and `Student.code` are unique.
- No student is registered twice in the same course and period, and no student exceeds 20 credits per period.
- Courses have 1–10 credits, and active courses only have active teachers.
- Every active registration has exactly one payment, and `amount` matches its `concept`.
- Books always have non-negative stock, and the number of open loans (`loan`/`late`) for a book never exceeds its `count`.
- A student has at most 5 open book loans, and returned loans have `return_date` > `date`.
- `Student`/`Teacher` counts match users with the corresponding role.
- Teachers who are not `active` have `school_dean_id = null`, and no school has more than one dean.
- Programs last between 4 and 8 periods, and all students are at least 16 years old.
- `actual_period` of a student never exceeds their program's `period_duration`.
