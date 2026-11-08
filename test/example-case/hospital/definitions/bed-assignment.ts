import { chaca, modules } from "../../../../src";
import { FindRef } from "../../core/find-ref";

export const BED_ASSIGNMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  admission_id: chaca.ref("Admission.id", { unique: true }),
  room_id: chaca.ref("Room.id", {
    where: async ({ refFields, store }) => {
      const admissions = await store.get("Admission");

      const activeCount = store
        .currentDocuments()
        .filter((b) => b.room_id === refFields.id)
        .filter((b) => {
          const linked = FindRef.execute({
            documents: admissions,
            id: b.admission_id,
            from: "BedAssignment.admission_id",
          });

          return linked.discharge_date === null;
        }).length;

      return activeCount < refFields.capacity;
    },
  }),
  assigned_date: async ({ currentFields, store }) => {
    const admissions = await store.get("Admission");
    const admission = FindRef.execute({
      documents: admissions,
      id: currentFields.admission_id,
      from: "BedAssignment.admission_id",
    });

    return admission.admission_date;
  },
});
