import { DatasetSchema } from "../../../../src";
import { AppointmentStatus } from "../types";
import { ADMISSION_SCHEMA } from "./admission";
import { APPOINTMENT_SCHEMA } from "./appointment";
import { BED_ASSIGNMENT_SCHEMA } from "./bed-assignment";
import { DEPARTMENT_SCHEMA } from "./department";
import { DOCTOR_SCHEMA } from "./doctor";
import { INVOICE_SCHEMA } from "./invoice";
import { MEDICATION_SCHEMA } from "./medication";
import { PATIENT_SCHEMA } from "./patient";
import { PRESCRIPTION_SCHEMA } from "./prescription";
import { ROOM_SCHEMA } from "./room";

export const HOSPITAL_SCHEMAS: DatasetSchema[] = [
  { documents: 150, name: "Admission", schema: ADMISSION_SCHEMA },
  { documents: 400, name: "Appointment", schema: APPOINTMENT_SCHEMA },
  {
    documents: async ({ store }) => {
      const admissions = await store.get("Admission");

      return admissions.length;
    },
    name: "BedAssignment",
    schema: BED_ASSIGNMENT_SCHEMA,
  },
  { documents: 8, name: "Department", schema: DEPARTMENT_SCHEMA },
  { documents: 30, name: "Doctor", schema: DOCTOR_SCHEMA },
  {
    documents: async ({ store }) => {
      const admissions = await store.get("Admission");

      return admissions.filter((a) => a.discharge_date !== null).length;
    },
    name: "Invoice",
    schema: INVOICE_SCHEMA,
  },
  { documents: 25, name: "Medication", schema: MEDICATION_SCHEMA },
  { documents: 200, name: "Patient", schema: PATIENT_SCHEMA },
  {
    documents: async ({ store }) => {
      const appointments = await store.get("Appointment");

      return appointments.filter((a) => {
        return a.status === AppointmentStatus.Completed;
      }).length;
    },
    name: "Prescription",
    schema: PRESCRIPTION_SCHEMA,
  },
  { documents: 40, name: "Room", schema: ROOM_SCHEMA },
];
