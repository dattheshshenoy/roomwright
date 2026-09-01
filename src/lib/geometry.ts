import type { Placement, Product, Room, WallSide } from "../state/types";

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const ROT_SNAP = Math.PI / 12; // 15 degrees

export function snapAngle(rad: number): number {
  return Math.round(rad / ROT_SNAP) * ROT_SNAP;
}

/** Axis-aligned bounds of a piece's footprint after its Y rotation, expanded by
 *  `pad` on every side. */
export function footprintAABB(placement: Placement, product: Product, pad = 0): AABB {
  const { w, d } = product.dims;
  const c = Math.abs(Math.cos(placement.rotationY));
  const s = Math.abs(Math.sin(placement.rotationY));
  const halfX = (w / 2) * c + (d / 2) * s + pad;
  const halfZ = (w / 2) * s + (d / 2) * c + pad;
  return {
    minX: placement.x - halfX,
    maxX: placement.x + halfX,
    minZ: placement.z - halfZ,
    maxZ: placement.z + halfZ,
  };
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

/** How far two AABBs interpenetrate on their least-overlapping axis. <= 0 means
 *  they are apart. */
export function overlapDepth(a: AABB, b: AABB): number {
  const x = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const z = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  if (x <= 0 || z <= 0) return Math.max(x, z);
  return Math.min(x, z);
}

/** Keep a piece's rotated footprint fully inside the room. */
export function clampToRoom(
  x: number,
  z: number,
  placement: Placement,
  product: Product,
  room: Room,
): { x: number; z: number } {
  const probe = footprintAABB({ ...placement, x, z }, product);
  const halfX = (probe.maxX - probe.minX) / 2;
  const halfZ = (probe.maxZ - probe.minZ) / 2;
  return {
    x: clamp(x, halfX, room.width - halfX),
    z: clamp(z, halfZ, room.length - halfZ),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return (lo + hi) / 2;
  return Math.max(lo, Math.min(hi, v));
}

/** Y rotation that puts a piece's back (local -z) flush against the given wall. */
const WALL_ROTATION: Record<WallSide, number> = {
  south: 0, // back to z = 0, front faces +z into the room
  north: Math.PI, // back to z = length, front faces -z
  west: Math.PI / 2, // back to x = 0
  east: -Math.PI / 2, // back to x = width
};

/** Unit vector a piece's front faces, given its Y rotation. */
export function frontDir(rotationY: number): [number, number] {
  return [Math.sin(rotationY), Math.cos(rotationY)];
}

/** A reasonable spot for a freshly added piece: wall-hugging pieces go flush to
 *  the emptiest wall, everything else lands near the room centre nudged clear of
 *  what's already there. */
export function autoPosition(
  product: Product,
  placements: { placement: Placement; product: Product }[],
  room: Room,
): { x: number; z: number; rotationY: number } {
  if (product.wallHugging) {
    const wall = emptiestWall(placements, room);
    const rotationY = WALL_ROTATION[wall];
    const probe: Placement = { id: "", productId: "", variantId: "", x: 0, z: 0, rotationY };
    const half = footprintAABB(probe, product);
    const halfX = (half.maxX - half.minX) / 2;
    const halfZ = (half.maxZ - half.minZ) / 2;
    switch (wall) {
      case "south":
        return { x: room.width / 2, z: halfZ + 0.05, rotationY };
      case "north":
        return { x: room.width / 2, z: room.length - halfZ - 0.05, rotationY };
      case "west":
        return { x: halfX + 0.05, z: room.length / 2, rotationY };
      case "east":
        return { x: room.width - halfX - 0.05, z: room.length / 2, rotationY };
    }
  }

  const base = { x: room.width / 2, z: room.length / 2 };
  for (let ring = 0; ring < 6; ring++) {
    for (const [dx, dz] of RING_OFFSETS) {
      const x = base.x + dx * ring * 0.6;
      const z = base.z + dz * ring * 0.6;
      const trial: Placement = { id: "", productId: "", variantId: "", x, z, rotationY: 0 };
      const clamped = clampToRoom(x, z, trial, product, room);
      const box = footprintAABB({ ...trial, ...clamped }, product, 0.05);
      const clash = placements.some((o) => aabbOverlap(box, footprintAABB(o.placement, o.product)));
      if (!clash) return { ...clamped, rotationY: 0 };
    }
  }
  return { ...base, rotationY: 0 };
}

const RING_OFFSETS: [number, number][] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

function emptiestWall(
  placements: { placement: Placement; product: Product }[],
  room: Room,
): WallSide {
  const load: Record<WallSide, number> = { north: 0, south: 0, east: 0, west: 0 };
  for (const { placement, product } of placements) {
    const b = footprintAABB(placement, product);
    if (b.minZ < 0.4) load.south += product.dims.w;
    if (b.maxZ > room.length - 0.4) load.north += product.dims.w;
    if (b.minX < 0.4) load.west += product.dims.w;
    if (b.maxX > room.width - 0.4) load.east += product.dims.w;
  }
  return (Object.keys(load) as WallSide[]).reduce((a, b) => (load[a] <= load[b] ? a : b));
}
