import type { ClearanceIssue, ClearanceStatus, LayoutReport, Opening, Room } from "../state/types";
import type { ResolvedPlacement } from "../state/selectors";
import { aabbOverlap, footprintAABB, frontDir, type AABB } from "../lib/geometry";

const WALKWAY_MIN = 0.75; // metres
const OPENING_ACCESS = 0.85; // clear depth an opening needs in front of it

/** Rugs are meant to sit under other pieces, so they're excluded from collision
 *  and clearance checks. Everything else — lamps and plants included — occupies
 *  real floor space. */
function solidsOnly(resolved: ResolvedPlacement[]): ResolvedPlacement[] {
  return resolved.filter((r) => r.product.kind !== "rug");
}

/** Fast collision-only pass for per-frame rendering feedback. */
export function collisionSet(resolved: ResolvedPlacement[]): Set<string> {
  const solid = solidsOnly(resolved);
  const hits = new Set<string>();
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      if (
        aabbOverlap(
          footprintAABB(solid[i].placement, solid[i].product),
          footprintAABB(solid[j].placement, solid[j].product),
        )
      ) {
        hits.add(solid[i].placement.id);
        hits.add(solid[j].placement.id);
      }
    }
  }
  return hits;
}

/** Per-placement worst status, for outline colour. */
export function statusMap(report: LayoutReport): Map<string, Exclude<ClearanceStatus, "ok">> {
  const m = new Map<string, Exclude<ClearanceStatus, "ok">>();
  for (const issue of report.issues) {
    const prev = m.get(issue.placementId);
    if (issue.status === "bad" || !prev) m.set(issue.placementId, issue.status);
  }
  return m;
}

/** The clearance zone in front of a piece it needs kept free. */
function clearanceZone(box: AABB, rotationY: number, depth: number): AABB {
  const [fx, fz] = frontDir(rotationY);
  const zone = { ...box };
  if (Math.abs(fx) > Math.abs(fz)) {
    if (fx > 0) zone.maxX += depth;
    else zone.minX -= depth;
  } else {
    if (fz > 0) zone.maxZ += depth;
    else zone.minZ -= depth;
  }
  return zone;
}

function openingAccessZone(o: Opening, room: Room): AABB {
  const d = OPENING_ACCESS;
  switch (o.wall) {
    case "south":
      return { minX: o.offset, maxX: o.offset + o.width, minZ: 0, maxZ: d };
    case "north":
      return { minX: o.offset, maxX: o.offset + o.width, minZ: room.length - d, maxZ: room.length };
    case "west":
      return { minX: 0, maxX: d, minZ: o.offset, maxZ: o.offset + o.width };
    case "east":
      return { minX: room.width - d, maxX: room.width, minZ: o.offset, maxZ: o.offset + o.width };
  }
}

function gap(a: AABB, b: AABB): number {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0);
  const dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ, 0);
  return Math.hypot(dx, dz);
}

export function analyzeLayout(resolved: ResolvedPlacement[], room: Room): LayoutReport {
  const issues: ClearanceIssue[] = [];
  const solid = solidsOnly(resolved);
  const boxes = solid.map((r) => ({ ...r, box: footprintAABB(r.placement, r.product) }));

  // collisions
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (aabbOverlap(boxes[i].box, boxes[j].box)) {
        issues.push({
          placementId: boxes[i].placement.id,
          withPlacementId: boxes[j].placement.id,
          status: "bad",
          message: `overlaps ${boxes[j].product.name}`,
        });
        issues.push({
          placementId: boxes[j].placement.id,
          withPlacementId: boxes[i].placement.id,
          status: "bad",
          message: `overlaps ${boxes[i].product.name}`,
        });
      }
    }
  }

  // clearance encroachment
  for (const a of boxes) {
    const depth = a.product.clearance.front;
    if (!depth) continue;
    const zone = clearanceZone(a.box, a.placement.rotationY, depth);
    for (const b of boxes) {
      if (b.placement.id === a.placement.id) continue;
      if (aabbOverlap(zone, b.box) && !aabbOverlap(a.box, b.box)) {
        issues.push({
          placementId: a.placement.id,
          withPlacementId: b.placement.id,
          status: "warn",
          message: `needs ${depth.toFixed(2)} m clear in front; ${b.product.name} is in the way`,
        });
      }
    }
  }

  // blocked openings
  for (const o of room.openings) {
    const zone = openingAccessZone(o, room);
    for (const b of boxes) {
      if (aabbOverlap(zone, b.box)) {
        issues.push({
          placementId: b.placement.id,
          status: o.kind === "door" ? "bad" : "warn",
          message: `blocks the ${o.wall} ${o.kind}`,
        });
      }
    }
  }

  // narrowest walkway between nearby pieces
  let narrowest: number | null = null;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const g = gap(boxes[i].box, boxes[j].box);
      if (g > 0.01 && g < 1.6) {
        narrowest = narrowest === null ? g : Math.min(narrowest, g);
        if (g < WALKWAY_MIN) {
          issues.push({
            placementId: boxes[i].placement.id,
            withPlacementId: boxes[j].placement.id,
            status: "warn",
            message: `only ${g.toFixed(2)} m to ${boxes[j].product.name} — tight to walk through`,
          });
        }
      }
    }
  }

  const status: ClearanceStatus = issues.some((i) => i.status === "bad")
    ? "bad"
    : issues.length > 0
      ? "warn"
      : "ok";

  return { status, issues, narrowestWalkway: narrowest };
}
