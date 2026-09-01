import type { Opening, Room, WallSide } from "../state/types";

export interface Rect {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

/** Solid rectangles of a wall once its openings are subtracted. `u` runs along
 *  the wall from its start corner, `v` runs up from the floor. */
export function wallSolids(len: number, height: number, openings: Opening[]): Rect[] {
  const sorted = [...openings].sort((a, b) => a.offset - b.offset);
  const out: Rect[] = [];
  let cursor = 0;

  for (const o of sorted) {
    const start = Math.max(0, Math.min(len, o.offset));
    const end = Math.max(0, Math.min(len, o.offset + o.width));
    if (start > cursor) out.push({ u0: cursor, u1: start, v0: 0, v1: height });
    if (o.sill > 0) out.push({ u0: start, u1: end, v0: 0, v1: o.sill });
    const top = o.sill + o.height;
    if (top < height) out.push({ u0: start, u1: end, v0: top, v1: height });
    cursor = Math.max(cursor, end);
  }
  if (cursor < len) out.push({ u0: cursor, u1: len, v0: 0, v1: height });
  return out;
}

export interface WallFrame {
  side: WallSide;
  /** wall length along its run */
  len: number;
  /** inward-facing unit normal, world space */
  normal: [number, number, number];
  /** map a wall-local (u, v) to a world position on the interior face */
  toWorld: (u: number, v: number) => [number, number, number];
  openings: Opening[];
}

export function wallFrames(room: Room): WallFrame[] {
  const { width: W, length: L, height: H } = room;
  const on = (side: WallSide) => room.openings.filter((o) => o.wall === side);
  void H;
  return [
    {
      side: "south",
      len: W,
      normal: [0, 0, 1],
      toWorld: (u, v) => [u, v, 0],
      openings: on("south"),
    },
    {
      side: "north",
      len: W,
      normal: [0, 0, -1],
      toWorld: (u, v) => [u, v, L],
      openings: on("north"),
    },
    {
      side: "west",
      len: L,
      normal: [1, 0, 0],
      toWorld: (u, v) => [0, v, u],
      openings: on("west"),
    },
    {
      side: "east",
      len: L,
      normal: [-1, 0, 0],
      toWorld: (u, v) => [W, v, u],
      openings: on("east"),
    },
  ];
}

export function roomCenter(room: Room): [number, number, number] {
  return [room.width / 2, room.height / 2, room.length / 2];
}

export function roomRadius(room: Room): number {
  return Math.hypot(room.width, room.length) / 2 + 1;
}
