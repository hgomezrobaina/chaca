import { modules } from "../../../src";
import { describe, expect, it } from "vitest";

describe("# Animal modules tests", () => {
  it("animal.bear", () => {
    const value = modules.animal.bear();
    expect(modules.animal.constants.bears.includes(value)).toBe(true);
  });

  it("animal.bird", () => {
    const value = modules.animal.bird();
    expect(modules.animal.constants.birds.includes(value)).toBe(true);
  });

  it("animal.cat", () => {
    const value = modules.animal.cat();
    expect(modules.animal.constants.cats.includes(value)).toBe(true);
  });

  it("animal.crocodilia", () => {
    const value = modules.animal.crocodilia();
    expect(modules.animal.constants.cocodrilas.includes(value)).toBe(true);
  });

  it("animal.cetacean", () => {
    const value = modules.animal.cetacean();
    expect(modules.animal.constants.ceteceans.includes(value)).toBe(true);
  });

  it("animal.cow", () => {
    const value = modules.animal.cow();
    expect(modules.animal.constants.cows.includes(value)).toBe(true);
  });

  it("animal.dog", () => {
    const value = modules.animal.dog();
    expect(modules.animal.constants.dogs.includes(value)).toBe(true);
  });

  it("animal.fish", () => {
    const value = modules.animal.fish();
    expect(modules.animal.constants.fishes.includes(value)).toBe(true);
  });

  it("animal.horse", () => {
    const value = modules.animal.horse();
    expect(modules.animal.constants.hourses.includes(value)).toBe(true);
  });

  it("animal.insect", () => {
    const value = modules.animal.insect();
    expect(modules.animal.constants.insects.includes(value)).toBe(true);
  });

  it("animal.lion", () => {
    const value = modules.animal.lion();
    expect(modules.animal.constants.lions.includes(value)).toBe(true);
  });

  it("animal.rabbit", () => {
    const value = modules.animal.rabbit();
    expect(modules.animal.constants.rabbits.includes(value)).toBe(true);
  });

  it("animal.rodent", () => {
    const value = modules.animal.rodent();
    expect(modules.animal.constants.rodents.includes(value)).toBe(true);
  });

  it("animal.snake", () => {
    const value = modules.animal.snake();
    expect(modules.animal.constants.snakes.includes(value)).toBe(true);
  });

  it("animal.type", () => {
    const value = modules.animal.type();
    expect(modules.animal.constants.animalTypes.en.includes(value)).toBe(true);
  });
});
