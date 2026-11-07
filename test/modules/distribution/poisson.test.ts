import { describe, expect, it } from "vitest";
import { ChacaError } from "../../../src";
import {
  PoissonAlgorithm,
  POISSON_PTRD_THRESHOLD,
} from "../../../src/modules/distribution/core/poisson/algorithm";
import { PoissonInversionAlgorithm } from "../../../src/modules/distribution/core/poisson/inversion-algorithm";
import { PoissonPtrdAlgorithm } from "../../../src/modules/distribution/core/poisson/ptrd-algorithm";
import { PoissonValidator } from "../../../src/modules/distribution/core/poisson/validator";

describe("distribution.poisson", () => {
  describe("inversion algorithm", () => {
    it("source = 0.5, lambda = 2. should return exactly 2", () => {
      const algorithm = new PoissonInversionAlgorithm({ next: () => 0.5 });

      expect(algorithm.execute({ lambda: 2 })).toBe(2);
    });

    it("source = 0 (below the first term). should return exactly 0", () => {
      const algorithm = new PoissonInversionAlgorithm({ next: () => 0 });

      expect(algorithm.execute({ lambda: 5 })).toBe(0);
    });
  });

  describe("branch dispatch", () => {
    it("lambda below the threshold. delegates to inversion", () => {
      const lambda = POISSON_PTRD_THRESHOLD - 1;

      const orchestrator = new PoissonAlgorithm({ next: () => 0.42 });
      const inversion = new PoissonInversionAlgorithm({ next: () => 0.42 });

      expect(orchestrator.execute({ lambda })).toBe(
        inversion.execute({ lambda }),
      );
    });

    it("lambda at the threshold. delegates to PTRD", () => {
      const lambda = POISSON_PTRD_THRESHOLD;
      const values = [0.3, 0.6, 0.42, 0.77, 0.51, 0.52, 0.49, 0.6];

      const makeSource = () => {
        let i = 0;
        return { next: () => values[i++ % values.length] };
      };

      const orchestrator = new PoissonAlgorithm(makeSource());
      const ptrd = new PoissonPtrdAlgorithm(makeSource());

      expect(orchestrator.execute({ lambda })).toBe(ptrd.execute({ lambda }));
    });
  });

  describe("validator", () => {
    it("lambda = 0. should throw a ChacaError with the exact message", () => {
      const validator = new PoissonValidator();

      expect(() => validator.execute({ lambda: 0 })).toThrow(ChacaError);
      expect(() => validator.execute({ lambda: 0 })).toThrow(
        "lambda must be greater than 0.",
      );
    });

    it("lambda = -1. should throw a ChacaError", () => {
      const validator = new PoissonValidator();

      expect(() => validator.execute({ lambda: -1 })).toThrow(ChacaError);
    });

    it("lambda = 1. should not throw", () => {
      const validator = new PoissonValidator();

      expect(() => validator.execute({ lambda: 1 })).not.toThrow();
    });
  });
});
