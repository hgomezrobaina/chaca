import { expect } from "vitest";
import { CaseRule } from "../core/case-rule";
import { FindRef } from "../core/find-ref";
import { AppointmentStatus, DoctorStatus, HospitalDataset } from "./types";

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

export const HOSPITAL_RULES: CaseRule<HospitalDataset>[] = [
  {
    id: "R1",
    text: "A doctor's years_experience is between 0 and 40",
    fields: ["Doctor.years_experience"],
    check: ({ Doctor }) => {
      for (const doctor of Doctor) {
        expect(doctor.years_experience).toBeGreaterThanOrEqual(0);
        expect(doctor.years_experience).toBeLessThanOrEqual(40);
      }
    },
  },
  {
    id: "R2",
    text: "A doctor's license_number is unique and sequential starting at 10000",
    fields: ["Doctor.license_number"],
    check: ({ Doctor }) => {
      const numbers = Doctor.map((doctor) => {
        return doctor.license_number;
      });

      expect(new Set(numbers).size).toBe(numbers.length);
      expect(Math.min(...numbers)).toBe(10000);
    },
  },
  {
    id: "R3",
    text: "A patient cannot have more than one simultaneous active admission",
    fields: ["Admission.patient_id", "Admission.discharge_date"],
    check: ({ Admission }) => {
      const activeByPatient = new Map<string, number>();

      for (const admission of Admission) {
        if (admission.discharge_date === null) {
          activeByPatient.set(
            admission.patient_id,
            (activeByPatient.get(admission.patient_id) ?? 0) + 1,
          );
        }
      }

      for (const count of activeByPatient.values()) {
        expect(count).toBeLessThanOrEqual(1);
      }
    },
  },
  {
    id: "R4",
    text: "An admission's discharge_date, when present, is after admission_date",
    fields: ["Admission.discharge_date", "Admission.admission_date"],
    check: ({ Admission }) => {
      for (const admission of Admission) {
        if (admission.discharge_date !== null) {
          expect(admission.discharge_date.getTime()).toBeGreaterThanOrEqual(
            admission.admission_date.getTime(),
          );
        }
      }
    },
  },
  {
    id: "R5",
    text: "Some admissions are still active and some are discharged",
    fields: ["Admission.discharge_date"],
    check: ({ Admission }) => {
      const active = Admission.filter((admission) => {
        return admission.discharge_date === null;
      });
      const discharged = Admission.filter((admission) => {
        return admission.discharge_date !== null;
      });

      expect(active.length).toBeGreaterThan(0);
      expect(discharged.length).toBeGreaterThan(0);
    },
  },
  {
    id: "R6",
    text: "Every admission has exactly one bed assignment",
    fields: ["BedAssignment.admission_id"],
    check: ({ Admission, BedAssignment }) => {
      for (const admission of Admission) {
        const found = BedAssignment.filter((bedAssignment) => {
          return bedAssignment.admission_id === admission.id;
        });

        expect(found).toHaveLength(1);
      }
    },
  },
  {
    id: "R7",
    text: "A room's active bed assignments never exceed its capacity",
    fields: [
      "BedAssignment.room_id",
      "Room.capacity",
      "Admission.discharge_date",
    ],
    check: ({ Room, BedAssignment, Admission }) => {
      for (const room of Room) {
        const activeCount = BedAssignment.filter((bedAssignment) => {
          if (bedAssignment.room_id !== room.id) {
            return false;
          }

          const admission = Admission.find((candidate) => {
            return candidate.id === bedAssignment.admission_id;
          });

          return admission !== undefined && admission.discharge_date === null;
        }).length;

        expect(activeCount).toBeLessThanOrEqual(room.capacity);
      }
    },
  },
  {
    id: "R8",
    text: "A bed assignment's assigned_date matches its admission's admission_date",
    fields: ["BedAssignment.assigned_date", "Admission.admission_date"],
    check: ({ BedAssignment, Admission }) => {
      for (const bedAssignment of BedAssignment) {
        const admission = FindRef.execute({
          documents: Admission,
          id: bedAssignment.admission_id,
          from: "BedAssignment.admission_id",
        });

        expect(bedAssignment.assigned_date.getTime()).toBe(
          admission.admission_date.getTime(),
        );
      }
    },
  },
  {
    id: "R9",
    text: "Only active doctors can have appointments assigned to them",
    fields: ["Appointment.doctor_id", "Doctor.status"],
    check: ({ Appointment, Doctor }) => {
      for (const appointment of Appointment) {
        const doctor = FindRef.execute({
          documents: Doctor,
          id: appointment.doctor_id,
          from: "Appointment.doctor_id",
        });

        expect(doctor.status).toBe(DoctorStatus.Active);
      }
    },
  },
  {
    id: "R10",
    text: "Appointments scheduled in the future can only be 'scheduled' or 'cancelled'",
    fields: ["Appointment.scheduled_date", "Appointment.status"],
    check: ({ Appointment }) => {
      const now = Date.now();

      for (const appointment of Appointment) {
        if (appointment.scheduled_date.getTime() > now) {
          expect([
            AppointmentStatus.Scheduled,
            AppointmentStatus.Cancelled,
          ]).toContain(appointment.status);
        }
      }
    },
  },
  {
    id: "R11",
    text: "Prescriptions can only reference completed appointments",
    fields: ["Prescription.appointment_id", "Appointment.status"],
    check: ({ Prescription, Appointment }) => {
      for (const prescription of Prescription) {
        const appointment = FindRef.execute({
          documents: Appointment,
          id: prescription.appointment_id,
          from: "Prescription.appointment_id",
        });

        expect(appointment.status).toBe(AppointmentStatus.Completed);
      }
    },
  },
  {
    id: "R12",
    text: "Prescriptions only reference medications that had stock",
    fields: ["Prescription.medication_id", "Medication.stock"],
    check: ({ Prescription, Medication }) => {
      for (const prescription of Prescription) {
        const medication = FindRef.execute({
          documents: Medication,
          id: prescription.medication_id,
          from: "Prescription.medication_id",
        });

        expect(medication.stock).toBeGreaterThan(0);
      }
    },
  },
  {
    id: "R13",
    text: "A prescription's quantity is between 1 and 30",
    fields: ["Prescription.quantity"],
    check: ({ Prescription }) => {
      for (const prescription of Prescription) {
        expect(prescription.quantity).toBeGreaterThanOrEqual(1);
        expect(prescription.quantity).toBeLessThanOrEqual(30);
      }
    },
  },
  {
    id: "R14",
    text: "Invoices can only reference discharged admissions",
    fields: ["Invoice.admission_id", "Admission.discharge_date"],
    check: ({ Invoice, Admission }) => {
      for (const invoice of Invoice) {
        const admission = FindRef.execute({
          documents: Admission,
          id: invoice.admission_id,
          from: "Invoice.admission_id",
        });

        expect(admission.discharge_date).not.toBeNull();
      }
    },
  },
  {
    id: "R15",
    text: "An admission can have at most one invoice",
    fields: ["Invoice.admission_id"],
    check: ({ Invoice }) => {
      for (const invoice of Invoice) {
        const sameAdmission = Invoice.filter((candidate) => {
          return candidate.admission_id === invoice.admission_id;
        });

        expect(sameAdmission).toHaveLength(1);
      }
    },
  },
  {
    id: "R16",
    text: "An invoice's amount equals the nights of stay times the department's daily_rate",
    fields: [
      "Invoice.amount",
      "Admission.discharge_date",
      "Admission.admission_date",
      "Department.daily_rate",
    ],
    check: ({ Invoice, Admission, Department }) => {
      for (const invoice of Invoice) {
        const admission = FindRef.execute({
          documents: Admission,
          id: invoice.admission_id,
          from: "Invoice.admission_id",
        });
        const department = FindRef.execute({
          documents: Department,
          id: admission.department_id,
          from: "Admission.department_id",
        });

        if (admission.discharge_date !== null) {
          const nights = Math.max(
            1,
            Math.ceil(
              (admission.discharge_date.getTime() -
                admission.admission_date.getTime()) /
                (24 * 60 * 60 * 1000),
            ),
          );

          expect(invoice.amount).toBe(
            Math.round(nights * department.daily_rate * 100) / 100,
          );
        }
      }
    },
  },
  {
    id: "R17",
    text: "A room's capacity is between 1 and 4 beds",
    fields: ["Room.capacity"],
    check: ({ Room }) => {
      for (const room of Room) {
        expect(room.capacity).toBeGreaterThanOrEqual(1);
        expect(room.capacity).toBeLessThanOrEqual(4);
      }
    },
  },
  {
    id: "R18",
    text: "Every patient is between 0 and 100 years old",
    fields: ["Patient.birthdate"],
    check: ({ Patient }) => {
      for (const patient of Patient) {
        const age = calculateAge(patient.birthdate);

        expect(age).toBeGreaterThanOrEqual(0);
        expect(age).toBeLessThanOrEqual(100);
      }
    },
  },
  {
    id: "R19",
    text: "Some patients are uninsured",
    fields: ["Patient.insurance_provider"],
    check: ({ Patient }) => {
      const uninsured = Patient.filter((patient) => {
        return patient.insurance_provider === null;
      });

      expect(uninsured.length).toBeGreaterThan(0);
    },
  },
  {
    id: "R20",
    text: "A medication's unit_price and stock are non-negative",
    fields: ["Medication.unit_price", "Medication.stock"],
    check: ({ Medication }) => {
      for (const medication of Medication) {
        expect(medication.unit_price).toBeGreaterThanOrEqual(1);
        expect(medication.stock).toBeGreaterThanOrEqual(0);
      }
    },
  },
  {
    id: "R21",
    text: "A medication's code is unique and sequential starting at 1000",
    fields: ["Medication.code"],
    check: ({ Medication }) => {
      const codes = Medication.map((medication) => {
        return medication.code;
      });

      expect(new Set(codes).size).toBe(codes.length);
      expect(Math.min(...codes)).toBe(1000);
    },
  },
];
