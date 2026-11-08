import { chaca, modules } from "../../../../src";
import { BookLoanStatus } from "../types";

export const BOOK_LOAN = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  student_id: chaca.ref("Student.id", {
    where: ({ refFields, store }) => {
      const result = store
        .currentDocuments()
        .filter((s) => s.student_id === refFields.id)
        .filter(
          (s) =>
            s.status === BookLoanStatus.Loan ||
            s.status === BookLoanStatus.Late,
        );

      return result.length < 5;
    },
  }),
  book_id: chaca.ref("Book.id", {
    where: ({ refFields }) => {
      return refFields.count > 0;
    },
  }),
  status: chaca.enum([
    BookLoanStatus.Loan,
    BookLoanStatus.Returned,
    BookLoanStatus.Late,
  ]),
  date: () => modules.date.past(),
  return_date: ({ currentFields }) => {
    if (currentFields.status === BookLoanStatus.Returned) {
      return modules.date.between({ from: currentFields.date, to: new Date() });
    }

    return null;
  },
});
