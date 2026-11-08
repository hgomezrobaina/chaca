import { chaca, modules } from "../../../../src";
import { AppointmentStatus, DoctorStatus } from "../types";

export const APPOINTMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  doctor_id: chaca.ref("Doctor.id", {
    where: ({ refFields }) => {
      return refFields.status === DoctorStatus.Active;
    },
  }),
  patient_id: chaca.ref("Patient.id"),
  scheduled_date: () => {
    const from = new Date();
    from.setMonth(from.getMonth() - 3);

    const to = new Date();
    to.setMonth(to.getMonth() + 2);

    return modules.date.between({ from, to });
  },
  status: ({ currentFields }) => {
    if (currentFields.scheduled_date.getTime() > Date.now()) {
      return chaca.utils.oneOfArray([
        AppointmentStatus.Scheduled,
        AppointmentStatus.Cancelled,
      ]);
    }

    return chaca.utils.oneOfArray([
      AppointmentStatus.Completed,
      AppointmentStatus.Cancelled,
      AppointmentStatus.NoShow,
    ]);
  },
});
