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

## Business rules

Every rule below has its own assertion in [rules.ts](rules.ts) (the full, field-level list is the generated "Rules" table in [schema.md](./schema.md)).

1. **Department** (`Department.name`): 8 distinct names, never repeated (`chaca.sequential`, not `chaca.enum`).
2. **Doctor** (`Doctor.years_experience`, `.license_number`): 0–40 years of experience; `license_number` is unique and sequential from 10000.
3. **Admission** (`Admission.patient_id`, `.admission_date`, `.discharge_date`, `.department_id`): no patient has two admissions with overlapping date ranges (any overlap, open or closed, not just "another currently open stay"); `discharge_date` is `null` 20% of the time (still admitted), otherwise after `admission_date`; evenly split across the 8 departments (always the least-assigned-so-far), so `BedAssignment` below isn't starved.
4. **`BedAssignment` is a 1:1 extension of admissions** (`BedAssignment.admission_id`, `.room_id`, `Room.department_id`, `.capacity`): one per admission; its room belongs to the **same department** as the admission, and its currently active assignments stay below the room's `capacity`.
5. **Room** (`Room.department_id`): evenly split across the 8 departments (always the least-assigned-so-far) — a plain random ref here starved some departments of rooms once `BedAssignment` started requiring a same-department room.
6. **Appointment** (`Appointment.doctor_id`, `Doctor.status`, `Appointment.status`, `.scheduled_date`): only `active` doctors get appointments; `status` depends on whether `scheduled_date` is in the past or future (mirrors the airline case's `Flight.status`).
7. **Prescription** (`Prescription.appointment_id`, `Appointment.status`, `Prescription.quantity`, `.medication_id`, `Medication.stock`): only `completed` appointments get prescriptions; the sum of a medication's prescribed quantities never exceeds its `stock`.
8. **`Invoice` is a 1:1 extension of discharged admissions** (`Invoice.admission_id`, `Admission.discharge_date`): only a discharged admission gets one, at most one each; `amount` resolves the admission → department chain to charge `nights × daily_rate` (the same "resolve the parent chain" pattern as the university case's `Payment.amount`).
9. **Natural ranges** (`Room.capacity`, `Patient.birthdate`, `Medication.code`): rooms hold 1–4 beds; patients are 0–100 years old; medication codes are unique and sequential from 1000.
