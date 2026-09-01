import type { Product, Room, WallSide } from "../state/types";
import type { ResolvedPlacement } from "../state/selectors";
import { aabbOverlap, footprintAABB, type AABB } from "../lib/geometry";
import { openingAccessZone } from "./clearance";

export type Anchor = WallSide | "centre" | "window" | "door";

export interface SpotOptions {
  /** if given, candidate spots must fit this product's footprint plus a margin */
  product?: Product;
  /** bias candidates toward this part of the room */
  near?: Anchor;
}

export interface Suggestion {
  x: number;
  z: number;
  rotation_degrees: number;
  against_wall: WallSide | null;
  clear_around_m: number;
  note: string;
}

export interface SpotReport {
  open_floor_m2: number;
  open_walls: { wall: WallSide; free_span_m: number }[];
  suggestions: Suggestion[];
}

const G = 0.2; // grid resolution, metres
const MARGIN = 0.25; // free space a candidate keeps around its footprint

function blockedBoxes(room: Room, resolved: ResolvedPlacement[]): AABB[] {
  const boxes: AABB[] = [];
  for (const { placement, product } of resolved) {
    if (product.kind === "rug") continue;
    const b = footprintAABB(placement, product, 0.1);
    boxes.push(b);
  }
  for (const o of room.openings) boxes.push(openingAccessZone(o, room));
  return boxes;
}

function makeGrid(room: Room, boxes: AABB[]) {
  const cols = Math.max(1, Math.round(room.width / G));
  const rows = Math.max(1, Math.round(room.length / G));
  const free: boolean[] = new Array(cols * rows);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i + 0.5) * G;
      const z = (j + 0.5) * G;
      free[j * cols + i] = !boxes.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
    }
  }
  return { cols, rows, free };
}

function fitsAt(x: number, z: number, w: number, d: number, boxes: AABB[], room: Room): boolean {
  const box: AABB = {
    minX: x - w / 2 - MARGIN,
    maxX: x + w / 2 + MARGIN,
    minZ: z - d / 2 - MARGIN,
    maxZ: z + d / 2 + MARGIN,
  };
  if (box.minX < 0 || box.maxX > room.width || box.minZ < 0 || box.maxZ > room.length) return false;
  return !boxes.some((b) => aabbOverlap(box, b));
}

function anchorPoint(room: Room, near: Anchor): [number, number] {
  const { width: W, length: L } = room;
  switch (near) {
    case "north":
      return [W / 2, L - 0.5];
    case "south":
      return [W / 2, 0.5];
    case "east":
      return [W - 0.5, L / 2];
    case "west":
      return [0.5, L / 2];
    case "centre":
      return [W / 2, L / 2];
    case "window":
    case "door": {
      const o = room.openings.find((op) => op.kind === near);
      if (!o) return [W / 2, L / 2];
      const z = openingAccessZone(o, room);
      return [(z.minX + z.maxX) / 2, (z.minZ + z.maxZ) / 2];
    }
  }
}

function nearestWall(room: Room, x: number, z: number): { wall: WallSide; dist: number } {
  const opts: [WallSide, number][] = [
    ["west", x],
    ["east", room.width - x],
    ["south", z],
    ["north", room.length - z],
  ];
  opts.sort((a, b) => a[1] - b[1]);
  return { wall: opts[0][0], dist: opts[0][1] };
}

function clearAround(x: number, z: number, boxes: AABB[], room: Room): number {
  let r = 0.1;
  while (r < 2.5) {
    if (!fitsAt(x, z, r * 2 - MARGIN * 2, r * 2 - MARGIN * 2, boxes, room)) break;
    r += 0.15;
  }
  return Math.round(r * 100) / 100;
}

export function suggestSpots(
  room: Room,
  resolved: ResolvedPlacement[],
  opts: SpotOptions = {},
): SpotReport {
  const boxes = blockedBoxes(room, resolved);
  const { cols, rows, free } = makeGrid(room, boxes);

  const open_floor_m2 = Math.round(free.filter(Boolean).length * G * G * 10) / 10;

  // longest contiguous free run along each wall's inner edge
  const inset = 0.4;
  const walls: WallSide[] = ["north", "south", "east", "west"];
  const open_walls = walls.map((wall) => {
    let best = 0;
    let run = 0;
    const horizontal = wall === "north" || wall === "south";
    const along = horizontal ? cols : rows;
    for (let k = 0; k < along; k++) {
      const t = (k + 0.5) * G;
      const x = horizontal ? t : wall === "west" ? inset : room.width - inset;
      const z = horizontal ? (wall === "south" ? inset : room.length - inset) : t;
      const openHere = !boxes.some((b) => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
      run = openHere ? run + G : 0;
      best = Math.max(best, run);
    }
    return { wall, free_span_m: Math.round(best * 10) / 10 };
  });

  // candidate footprint
  const w = opts.product?.dims.w ?? 1.0;
  const d = opts.product?.dims.d ?? 0.8;
  const wallHugging = opts.product?.wallHugging ?? false;
  const [ax, az] = opts.near ? anchorPoint(room, opts.near) : [room.width / 2, room.length / 2];

  const scored: { score: number; s: Suggestion }[] = [];
  for (let x = 0.4; x < room.width; x += 0.4) {
    for (let z = 0.4; z < room.length; z += 0.4) {
      let rot = 0;
      let ok = fitsAt(x, z, w, d, boxes, room);
      if (!ok && fitsAt(x, z, d, w, boxes, room)) {
        ok = true;
        rot = 90;
      }
      if (!ok) continue;

      const nw = nearestWall(room, x, z);
      if (wallHugging && nw.dist > 0.9) continue;

      const anchorDist = Math.hypot(x - ax, z - az);
      const roomy = clearAround(x, z, boxes, room);
      const against = nw.dist < 0.75 ? nw.wall : null;

      const score =
        anchorDist - roomy * 1.5 + (wallHugging && against ? -3 : 0) + (against ? -0.6 : 0);

      scored.push({
        score,
        s: {
          x: Math.round(x * 20) / 20,
          z: Math.round(z * 20) / 20,
          rotation_degrees: rot,
          against_wall: against,
          clear_around_m: roomy,
          note:
            (against ? `against the ${against} wall` : "in open floor") +
            `, ~${roomy.toFixed(1)} m clear around` +
            (opts.near ? `, ${anchorDist.toFixed(1)} m from the ${opts.near}` : ""),
        },
      });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  const suggestions: Suggestion[] = [];
  for (const { s } of scored) {
    if (suggestions.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 0.9)) continue;
    suggestions.push(s);
    if (suggestions.length === 3) break;
  }

  return { open_floor_m2, open_walls, suggestions };
}
