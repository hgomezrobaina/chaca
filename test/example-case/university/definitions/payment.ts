import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import {
  PaymentConcept,
  PaymentMethod,
  PaymentStatus,
  RegistrationStatus,
} from "../types";

export const PAYMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  method: chaca.enum([
    PaymentMethod.CreditCard,
    PaymentMethod.Transfer,
    PaymentMethod.Cash,
  ]),
  registration_id: chaca.ref("Registration.id", {
    where: ({ refFields }) => {
      return refFields.status === RegistrationStatus.Active;
    },
  }),
  status: ({ currentFields, store }) => {
    const exists = store.currentDocuments().filter((r) => {
      return (
        r.id !== currentFields.id &&
        r.registration_id === currentFields.registration_id &&
        r.status !== PaymentStatus.Failed
      );
    });

    if (exists.length > 0) {
      return PaymentStatus.Failed;
    } else {
      return chaca.utils.oneOfArray([
        PaymentStatus.Pending,
        PaymentStatus.Completed,
        PaymentStatus.Failed,
      ]);
    }
  },
  concept: chaca.enum([
    PaymentConcept.Registration,
    PaymentConcept.ExtraCourse,
    PaymentConcept.Certificate,
    PaymentConcept.Library,
  ]),
  amount: async ({ currentFields, store }) => {
    const registrations = await store.get("Registration");
    const courses = await store.get("Course");
    const programs = await store.get("Program");

    const registration = FindRef.execute({
      documents: registrations,
      id: currentFields.registration_id,
      from: "Payment.registration_id",
    });
    const course = FindRef.execute({
      documents: courses,
      id: registration.course_id,
      from: "Registration.course_id",
    });
    const program = FindRef.execute({
      documents: programs,
      id: course.program_id,
      from: "Course.program_id",
    });

    return program.cost;
  },
  created_at: () => modules.date.past(),
});
