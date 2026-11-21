import { describe, expect, it } from "vitest";
import { modules } from "../../../src";

describe("vehicle modules", () => {
  it("vehicle.bicycle", () => {
    const value = modules.vehicle.bicycle();
    expect(modules.vehicle.constants.bicycles.en).include(value);
  });

  it("vehicle.manufacturer", () => {
    const value = modules.vehicle.manufacturer();
    expect(modules.vehicle.constants.manufacturers).include(value);
  });

  it("vehicle.model", () => {
    const value = modules.vehicle.model();
    expect(modules.vehicle.constants.models).include(value);
  });

  it("vehicle.type", () => {
    const value = modules.vehicle.type();
    expect(modules.vehicle.constants.vehicleTypes.en).include(value);
  });

  it("vehicle.fuel", () => {
    const value = modules.vehicle.fuel();
    expect(modules.vehicle.constants.fuels.en).include(value);
  });

  it("vehicle.vehicle", () => {
    const value = modules.vehicle.vehicle();

    // value is `${manufacturer} ${model}` and both parts can contain spaces,
    // so find the manufacturer prefix and check the remainder is a model
    const isValid = modules.vehicle.constants.manufacturers.some(
      (manufacturer) =>
        value.startsWith(`${manufacturer} `) &&
        modules.vehicle.constants.models.includes(
          value.slice(manufacturer.length + 1),
        ),
    );

    expect(isValid).toBe(true);
  });
});
