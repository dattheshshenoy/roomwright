import type { ResolvedPlacement } from "../state/selectors";
import { aabbOverlap, footprintAABB } from "../lib/geometry";

/** Ids of pieces whose footprints overlap another piece. Rugs are ignored —
 *  everything is meant to sit on them. Expanded with walkway + opening analysis
 *  in the clearance phase. */
export function collisionSet(resolved: ResolvedPlacement[]): Set<string> {
  const solid = resolved.filter((r) => r.product.kind !== "rug");
  const hits = new Set<string>();
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = footprintAABB(solid[i].placement, solid[i].product);
      const b = footprintAABB(solid[j].placement, solid[j].product);
      if (aabbOverlap(a, b)) {
        hits.add(solid[i].placement.id);
        hits.add(solid[j].placement.id);
      }
    }
  }
  return hits;
}
