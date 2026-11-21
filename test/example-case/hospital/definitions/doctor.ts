import { chaca, modules } from "../../../../src";
import { DoctorSpecialty, DoctorStatus } from "../types";

export const DOCTOR_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  department_id: chaca.ref("Department.id"),
  license_number: chaca.sequence({ startsWith: 10000 }),
  specialty: chaca.enum([
    DoctorSpecialty.Cardiology,
    DoctorSpecialty.Neurology,
    DoctorSpecialty.Pediatrics,
    DoctorSpecialty.Oncology,
    DoctorSpecialty.Orthopedics,
    DoctorSpecialty.EmergencyMedicine,
    DoctorSpecialty.Radiology,
    DoctorSpecialty.GeneralSurgery,
  ]),
  years_experience: () => modules.datatype.int({ min: 0, max: 40 }),
  status: chaca.enum([
    DoctorStatus.Active,
    DoctorStatus.OnLeave,
    DoctorStatus.Retired,
  ]),
});
