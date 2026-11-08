# Hospital case

A hospital: patients get admitted into departments, are assigned a bed, see doctors in appointments, get prescribed medication, and are billed on discharge.

## Entities

| Entity          | Documents                          | Description                                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `Department`    | 8                                   | A hospital department (Cardiology, Emergency Medicine, etc); 8 distinct names, never repeated. |
| `Doctor`        | 30                                  | Belongs to a `Department`; `license_number` is sequential.                |
| `Patient`       | 200                                 | May be uninsured (`insurance_provider` is nullable).                     |
| `Room`          | 64                                  | Holds 1–4 beds (`capacity`); evenly split across departments.           |
| `Admission`     | 150                                 | A patient's stay in a department, evenly split across departments; `discharge_date` is null while active, and no patient has two overlapping stays. |
| `BedAssignment` | one per admission                   | Links an admission to a room of the same department, respecting its capacity. |
| `Appointment`   | 400                                 | A patient seeing a doctor; status depends on whether it's past or future. |
| `Medication`    | 25                                  | Pharmacy stock; `code` is sequential.                                    |
| `Prescription`  | linked to completed appointments    | Medication prescribed during a completed appointment; a visit can produce zero, one, or several prescriptions, so this is **not** a 1:1 relationship. |
| `Invoice`       | one per discharged admission        | Billed once the patient is discharged.                                  |

## Schema

See [schema.md](./schema.md) for the full ER diagram, a field-by-field table per entity and the rule table — generated from the schema definitions, never hand-written.

## Business rules encoded in the schemas

- **Admission**: `admission_date`/`discharge_date` are generated before `patient_id` so its `where` can reject a patient whose existing stays overlap the new one's date range (not just "another currently-open stay" — any date overlap, open or closed). `discharge_date` is `null` 20% of the time (still admitted); otherwise it's a date between `admission_date` and now. `department_id`'s `where` always picks the department with the fewest admissions assigned so far, keeping the 150 admissions evenly split across the 8 departments — without this, `BedAssignment` could starve a department that drew too many admissions by chance.
- **BedAssignment**: `room_id` only accepts a room in the same department as the admission, whose currently active assignments (linked admission still without a `discharge_date`) are below its `capacity`.
- **Room**: `department_id`'s `where` always picks the department with the fewest rooms assigned so far, keeping the 64 rooms evenly split (8 per department) — a plain random `ref` here left some departments with too few rooms for their admissions, a real (not theoretical) `NotEnoughValuesForRefError` in most runs once `BedAssignment` started requiring a same-department room.
- **Appointment**: `doctor_id` only accepts `active` doctors. `status` depends on whether `scheduled_date` is in the past or future, mirroring the airline case's `Flight.status`.
- **Prescription**: `appointment_id` only accepts `completed` appointments; `quantity` is generated before `medication_id` so its `where` can reject a medication whose stock, minus everything already prescribed from it, can't cover this prescription's `quantity`.
- **Invoice**: `admission_id` only accepts discharged admissions (`discharge_date !== null`); `amount` resolves the admission → department chain to charge `nights * daily_rate`, the same "resolve the parent chain" pattern as the university case's `Payment.amount`.

## Validations (in [hospital.test.ts](hospital.test.ts))

- Doctors have 0–40 years of experience, and `license_number` is unique and sequential from 10000.
- There are exactly 8 departments, each with a distinct name.
- No patient has two admissions with overlapping date ranges, and `discharge_date` is always after `admission_date`.
- Every admission has exactly one bed assignment, that bed's room belongs to the admission's department, and a room's active assignments never exceed its capacity.
- Only active doctors have appointments, and future appointments are only `scheduled` or `cancelled`.
- Prescriptions only reference completed appointments, and the sum of a medication's prescribed quantities never exceeds its stock.
- Invoices only reference discharged admissions, at most one per admission, and `amount` matches the nights-of-stay × department `daily_rate` computation.
- Rooms have 1–4 beds, patients are 0–100 years old, and medication codes are unique and sequential from 1000.
