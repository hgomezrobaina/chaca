import { chaca, modules } from "../../../../src";
import { DepartmentName } from "../types";

export const DEPARTMENT_SCHEMA = chaca.schema({
  id: chaca.key(() => modules.id.uuid()),
  name: chaca.enum([
    DepartmentName.Cardiology,
    DepartmentName.Neurology,
    DepartmentName.Pediatrics,
    DepartmentName.Oncology,
    DepartmentName.Orthopedics,
    DepartmentName.EmergencyMedicine,
    DepartmentName.Radiology,
    DepartmentName.GeneralSurgery,
  ]),
  floor: () => modules.datatype.int({ min: 1, max: 10 }),
  daily_rate: () =>
    modules.datatype.float({ precision: 2, min: 100, max: 1000 }),
});
