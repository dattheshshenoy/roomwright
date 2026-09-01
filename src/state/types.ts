/** All spatial values are metres unless noted. Room-local coordinates, origin at
 *  the room's near-left corner (min x, min z), y up. */

export type WallSide = "north" | "south" | "east" | "west";

export type OpeningKind = "door" | "window";

export interface Opening {
  id: string;
  kind: OpeningKind;
  wall: WallSide;
  /** distance from the wall's start corner to the opening's near edge */
  offset: number;
  width: number;
  /** sill height for windows; 0 for doors */
  sill: number;
  height: number;
}

export interface Room {
  width: number; // x extent
  length: number; // z extent
  height: number; // y extent
  openings: Opening[];
}

export type BuilderKind =
  | "sofa"
  | "armchair"
  | "chair"
  | "table"
  | "coffeeTable"
  | "sideTable"
  | "bed"
  | "rug"
  | "lamp"
  | "shelf"
  | "plant"
  | "screen";

export type Category = "seating" | "tables" | "sleeping" | "storage" | "lighting" | "decor";

export interface Variant {
  id: string;
  name: string;
  /** hex, the dominant surface colour */
  color: string;
  /** perceptual material family, drives roughness/metalness in the builder */
  finish: "fabric" | "leather" | "wood" | "metal" | "ceramic" | "woven";
}

export interface Product {
  id: string;
  name: string;
  kind: BuilderKind;
  category: Category;
  /** footprint + height of the piece itself */
  dims: { w: number; d: number; h: number };
  variants: Variant[];
  /** USD, for the shopping list */
  price: number;
  /** free space the piece needs to be usable, metres */
  clearance: { front?: number; sides?: number; back?: number };
  /** true for pieces that sit flush to a wall by default (sofa, shelf, bed) */
  wallHugging: boolean;
}

export interface Placement {
  id: string;
  productId: string;
  variantId: string;
  x: number; // centre, room-local
  z: number;
  rotationY: number; // radians, snapped to 15deg
}

export type ClearanceStatus = "ok" | "warn" | "bad";

export interface ClearanceIssue {
  placementId: string;
  status: Exclude<ClearanceStatus, "ok">;
  message: string;
  /** id of the other placement, when the issue is a collision */
  withPlacementId?: string;
}

export interface LayoutReport {
  status: ClearanceStatus;
  issues: ClearanceIssue[];
  /** narrowest detected walkway between pieces, metres; null if none measured */
  narrowestWalkway: number | null;
}

export interface AgentLogEntry {
  id: string;
  ts: number;
  tool: string;
  args: unknown;
  ok: boolean;
  summary: string;
}

export type ViewMode = "orbit" | "top";
