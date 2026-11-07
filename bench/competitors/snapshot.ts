import type { Snapshot } from "../shared/snapshot";
import type { CompetitorVersions } from "./load";

/**
 * Un snapshot normal (`bench/shared/snapshot.ts`) más las versiones exactas
 * de los tres competidores medidos con él. Se escribe con el mismo
 * `writeSnapshot` que usan los otros cuatro — no hay un formato aparte, sólo
 * un campo más.
 */
export interface CompetitorsSnapshot extends Snapshot {
  competitors: CompetitorVersions;
}
