import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import { InvoiceStatus } from "../types";

export const INVOICE_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  admission_id: chaca.ref("Admission.id", {
    unique: true,
    where: ({ refFields }) => {
      return refFields.discharge_date !== null;
    },
  }),
  amount: async ({ currentFields, store }) => {
    const admissions = await store.get("Admission");
    const admission = FindRef.execute({
      documents: admissions,
      id: currentFields.admission_id,
      from: "Invoice.admission_id",
    });
    const departments = await store.get("Department");
    const department = FindRef.execute({
      documents: departments,
      id: admission.department_id,
      from: "Admission.department_id",
    });

    const nights = Math.max(
      1,
      Math.ceil(
        (admission.discharge_date.getTime() -
          admission.admission_date.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );

    return Math.round(nights * department.daily_rate * 100) / 100;
  },
  status: chaca.enum([
    InvoiceStatus.Pending,
    InvoiceStatus.Paid,
    InvoiceStatus.Overdue,
  ]),
});
