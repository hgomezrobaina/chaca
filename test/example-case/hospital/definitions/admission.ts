import { chaca, modules } from "../../../../src";

interface StaysOverlapProps {
  aStart: Date;
  aEnd: Date | null;
  bStart: Date;
  bEnd: Date | null;
}

const staysOverlap = ({
  aStart,
  aEnd,
  bStart,
  bEnd,
}: StaysOverlapProps): boolean => {
  const aEndTime = aEnd === null ? Infinity : aEnd.getTime();
  const bEndTime = bEnd === null ? Infinity : bEnd.getTime();

  return aStart.getTime() <= bEndTime && bStart.getTime() <= aEndTime;
};

export const ADMISSION_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  admission_date: () => modules.date.past({ years: 2 }),
  discharge_date: {
    type: ({ currentFields }) =>
      modules.date.between({
        from: currentFields.admission_date,
        to: new Date(),
      }),
    possibleNull: 0.2,
  },
  patient_id: chaca.ref("Patient.id", {
    where: ({ refFields, currentFields, store }) => {
      const overlapping = store.currentDocuments().filter((admission) => {
        return (
          admission.patient_id === refFields.id &&
          staysOverlap({
            aStart: admission.admission_date,
            aEnd: admission.discharge_date,
            bStart: currentFields.admission_date,
            bEnd: currentFields.discharge_date,
          })
        );
      });

      return overlapping.length === 0;
    },
  }),
  department_id: chaca.ref("Department.id", {
    where: async ({ refFields, store }) => {
      const departments = await store.get("Department");
      const counts = new Map<string, number>();

      for (const department of departments) {
        counts.set(department.id, 0);
      }

      for (const admission of store.currentDocuments()) {
        if (admission.department_id === undefined) {
          continue;
        }

        counts.set(
          admission.department_id,
          (counts.get(admission.department_id) ?? 0) + 1,
        );
      }

      const minCount = Math.min(...counts.values());

      return counts.get(refFields.id) === minCount;
    },
  }),
  reason: () => modules.lorem.words(),
});
