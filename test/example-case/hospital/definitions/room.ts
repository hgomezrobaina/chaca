import { chaca, modules } from "../../../../src";

export const ROOM_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  department_id: chaca.ref("Department.id", {
    where: async ({ refFields, store }) => {
      const departments = await store.get("Department");
      const counts = new Map<string, number>();

      for (const department of departments) {
        counts.set(department.id, 0);
      }

      for (const room of store.currentDocuments()) {
        if (room.department_id === undefined) {
          continue;
        }

        counts.set(
          room.department_id,
          (counts.get(room.department_id) ?? 0) + 1,
        );
      }

      const minCount = Math.min(...counts.values());

      return counts.get(refFields.id) === minCount;
    },
  }),
  room_number: chaca.sequence({ startsWith: 100 }),
  capacity: () => modules.datatype.int({ min: 1, max: 4 }),
});
