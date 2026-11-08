import { chaca, modules } from "../../../../src";
import { AppointmentStatus } from "../types";

export const PRESCRIPTION_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  appointment_id: chaca.ref("Appointment.id", {
    where: ({ refFields }) => {
      return refFields.status === AppointmentStatus.Completed;
    },
  }),
  medication_id: chaca.ref("Medication.id", {
    where: ({ refFields }) => {
      return refFields.stock > 0;
    },
  }),
  dosage: () => {
    const amount = modules.datatype.int({ min: 1, max: 2 });
    const frequency = chaca.utils.oneOfArray([4, 6, 8, 12, 24]);

    return `${amount} tablet(s) every ${frequency}h`;
  },
  quantity: () => modules.datatype.int({ min: 1, max: 30 }),
});
