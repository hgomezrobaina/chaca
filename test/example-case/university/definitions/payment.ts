import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";
import {
  PaymentConcept,
  PaymentMethod,
  PaymentStatus,
  RegistrationStatus,
} from "../types";
import {
  CERTIFICATE_FEE,
  EXTRA_COURSE_FEE_PER_CREDIT,
  LIBRARY_FINE,
} from "./fees";

export const PAYMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  method: chaca.enum([
    PaymentMethod.CreditCard,
    PaymentMethod.Transfer,
    PaymentMethod.Cash,
  ]),
  registration_id: chaca.ref("Registration.id", {
    unique: true,
    where: ({ refFields }) => {
      return refFields.status === RegistrationStatus.Active;
    },
  }),
  status: chaca.enum([
    PaymentStatus.Pending,
    PaymentStatus.Completed,
    PaymentStatus.Failed,
  ]),
  concept: chaca.enum([
    PaymentConcept.Registration,
    PaymentConcept.ExtraCourse,
    PaymentConcept.Certificate,
    PaymentConcept.Library,
  ]),
  amount: async ({ currentFields, store }) => {
    if (currentFields.concept === PaymentConcept.Certificate) {
      return CERTIFICATE_FEE;
    }

    if (currentFields.concept === PaymentConcept.Library) {
      return LIBRARY_FINE;
    }

    const registrations = await store.get("Registration");
    const courses = await store.get("Course");

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

    if (currentFields.concept === PaymentConcept.ExtraCourse) {
      return course.credits * EXTRA_COURSE_FEE_PER_CREDIT;
    }

    const programs = await store.get("Program");
    const program = FindRef.execute({
      documents: programs,
      id: course.program_id,
      from: "Course.program_id",
    });

    return program.cost;
  },
  created_at: () => modules.date.past(),
});
