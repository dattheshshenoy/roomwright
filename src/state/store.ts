import { create } from "zustand";
import type {
  AgentLogEntry,
  Opening,
  OpeningKind,
  Placement,
  Room,
  ViewMode,
  WallSide,
} from "./types";
import type { UnitSystem } from "../lib/units";
import {
  clearCustomProducts,
  getProduct,
  registerCustomProduct,
  unregisterCustomProduct,
} from "../catalog/catalog";
import { makeCustomProduct, type CustomSpec } from "../catalog/customProducts";
import { nid } from "../lib/id";
import type { Product } from "./types";
import { autoPosition, clampToRoom, snapAngle } from "../lib/geometry";

const DEFAULT_ROOM: Room = {
  width: 4.6,
  length: 5.4,
  height: 2.6,
  openings: [
    { id: "door-1", kind: "door", wall: "south", offset: 0.6, width: 0.9, sill: 0, height: 2.04 },
    { id: "win-1", kind: "window", wall: "north", offset: 1.7, width: 1.6, sill: 0.9, height: 1.2 },
  ],
};

interface Snapshot {
  room: Room;
  placements: Placement[];
  selectedId: string | null;
}

interface AddResult {
  ok: boolean;
  placementId?: string;
  reason?: string;
}

interface MoveResult {
  ok: boolean;
  clamped: boolean;
  reason?: string;
}

export interface Store {
  room: Room;
  placements: Placement[];
  /** user-defined primitive products; referenced by placements, persisted */
  customProducts: Product[];
  selectedId: string | null;
  agentLog: AgentLogEntry[];
  view: ViewMode;
  unitSystem: UnitSystem;
  /** true while the user is dragging a piece — the camera is frozen so the room
   *  does not move under the pointer */
  dragging: boolean;

  past: Snapshot[];
  future: Snapshot[];

  addPlacement: (
    productId: string,
    opts?: { variantId?: string; x?: number; z?: number; rotationY?: number },
  ) => AddResult;
  movePlacement: (id: string, x: number, z: number) => MoveResult;
  rotatePlacement: (id: string, radians: number, absolute?: boolean) => { ok: boolean };
  resizePlacement: (
    id: string,
    dims: Partial<{ w: number; d: number; h: number }>,
  ) => { ok: boolean; dims?: { w: number; d: number; h: number }; reason?: string };
  removePlacement: (id: string) => { ok: boolean };
  setVariant: (id: string, variantId: string) => { ok: boolean };
  setRoomDimensions: (dims: Partial<Pick<Room, "width" | "length" | "height">>) => {
    ok: boolean;
    outOfBounds: string[];
  };
  createCustom: (spec: CustomSpec) => { ok: boolean; productId?: string };
  updateCustom: (
    productId: string,
    patch: Partial<Pick<CustomSpec, "name" | "width" | "depth" | "height" | "color">>,
  ) => { ok: boolean };
  removeCustom: (productId: string) => { ok: boolean };
  addOpening: (kind: OpeningKind, wall: WallSide) => { ok: boolean; id?: string };
  updateOpening: (
    id: string,
    patch: Partial<Pick<Opening, "kind" | "wall" | "offset" | "width" | "sill" | "height">>,
  ) => { ok: boolean; reason?: string };
  removeOpening: (id: string) => { ok: boolean };

  select: (id: string | null) => void;
  setView: (v: ViewMode) => void;
  setUnitSystem: (u: UnitSystem) => void;
  setDragging: (v: boolean) => void;
  pushLog: (entry: Omit<AgentLogEntry, "id" | "ts">) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;

  hydrate: (
    partial: Partial<Pick<Store, "room" | "placements" | "unitSystem" | "customProducts">>,
  ) => void;
}

const HISTORY_LIMIT = 50;

export const useStore = create<Store>((set, get) => {
  const snapshot = (): Snapshot => {
    const { room, placements, selectedId } = get();
    return { room, placements, selectedId };
  };

  const commit = (next: Partial<Snapshot>) => {
    set((s) => ({
      past: [...s.past.slice(-HISTORY_LIMIT + 1), snapshot()],
      future: [],
      ...next,
    }));
  };

  const resolved = () =>
    get()
      .placements.map((placement) => {
        const product = getProduct(placement.productId);
        return product ? { placement, product } : null;
      })
      .filter(
        (v): v is { placement: Placement; product: NonNullable<ReturnType<typeof getProduct>> } =>
          v !== null,
      );

  return {
    room: DEFAULT_ROOM,
    placements: [],
    customProducts: [],
    selectedId: null,
    agentLog: [],
    view: "orbit",
    unitSystem: "metric",
    dragging: false,
    past: [],
    future: [],

    createCustom: (spec) => {
      const product = makeCustomProduct(spec);
      registerCustomProduct(product);
      set((s) => ({ customProducts: [...s.customProducts, product] }));
      return { ok: true, productId: product.id };
    },

    updateCustom: (productId, patch) => {
      const cur = get().customProducts.find((p) => p.id === productId);
      if (!cur) return { ok: false };
      const next = makeCustomProduct({
        shape: cur.shape ?? "box",
        name: patch.name ?? cur.name,
        width: patch.width ?? cur.dims.w,
        depth: patch.depth ?? cur.dims.d,
        height: patch.height ?? cur.dims.h,
        color: patch.color ?? cur.variants[0].color,
        wallHugging: cur.wallHugging,
      });
      const updated: Product = { ...next, id: productId };
      registerCustomProduct(updated);
      set((s) => ({
        customProducts: s.customProducts.map((p) => (p.id === productId ? updated : p)),
      }));
      // re-clamp any placements of this product for the new footprint
      const room = get().room;
      commit({
        placements: get().placements.map((p) => {
          if (p.productId !== productId) return p;
          const c = clampToRoom(p.x, p.z, p, updated, room);
          return { ...p, x: c.x, z: c.z };
        }),
      });
      return { ok: true };
    },

    removeCustom: (productId) => {
      if (!get().customProducts.some((p) => p.id === productId)) return { ok: false };
      unregisterCustomProduct(productId);
      set((s) => ({ customProducts: s.customProducts.filter((p) => p.id !== productId) }));
      commit({
        placements: get().placements.filter((p) => p.productId !== productId),
        selectedId: null,
      });
      return { ok: true };
    },

    addPlacement: (productId, opts = {}) => {
      const product = getProduct(productId);
      if (!product) return { ok: false, reason: `unknown product "${productId}"` };

      const variantId =
        opts.variantId && product.variants.some((v) => v.id === opts.variantId)
          ? opts.variantId
          : product.variants[0].id;

      const others = resolved();
      const spot =
        opts.x != null && opts.z != null
          ? { x: opts.x, z: opts.z, rotationY: snapAngle(opts.rotationY ?? 0) }
          : autoPosition(product, others, get().room);

      const draft: Placement = {
        id: nid("p"),
        productId,
        variantId,
        rotationY: spot.rotationY,
        x: spot.x,
        z: spot.z,
      };
      const c = clampToRoom(draft.x, draft.z, draft, product, get().room);
      draft.x = c.x;
      draft.z = c.z;

      commit({ placements: [...get().placements, draft], selectedId: draft.id });
      return { ok: true, placementId: draft.id };
    },

    movePlacement: (id, x, z) => {
      const target = get().placements.find((p) => p.id === id);
      if (!target) return { ok: false, clamped: false, reason: `no placement "${id}"` };
      const product = getProduct(target.productId);
      if (!product) return { ok: false, clamped: false, reason: "product missing" };

      const c = clampToRoom(x, z, target, product, get().room);
      const clamped = Math.abs(c.x - x) > 1e-4 || Math.abs(c.z - z) > 1e-4;
      commit({
        placements: get().placements.map((p) => (p.id === id ? { ...p, x: c.x, z: c.z } : p)),
      });
      return { ok: true, clamped };
    },

    rotatePlacement: (id, radians, absolute = false) => {
      const target = get().placements.find((p) => p.id === id);
      const product = target && getProduct(target.productId);
      if (!target || !product) return { ok: false };
      const rotationY = snapAngle(absolute ? radians : target.rotationY + radians);
      // the rotated footprint has a different extent — pull it back inside the room
      const rotated: Placement = { ...target, rotationY };
      const c = clampToRoom(target.x, target.z, rotated, product, get().room);
      commit({
        placements: get().placements.map((p) =>
          p.id === id ? { ...p, rotationY, x: c.x, z: c.z } : p,
        ),
      });
      return { ok: true };
    },

    resizePlacement: (id, dims) => {
      const target = get().placements.find((p) => p.id === id);
      const base = target && getProduct(target.productId);
      if (!target || !base) return { ok: false, reason: "no such piece" };

      const cur = target.dims ?? base.dims;
      const clampM = (v: number, fallback: number) =>
        Number.isFinite(v) ? Math.max(0.15, Math.min(8, v)) : fallback;
      const next = {
        w: clampM(dims.w ?? cur.w, cur.w),
        d: clampM(dims.d ?? cur.d, cur.d),
        h: clampM(dims.h ?? cur.h, cur.h),
      };

      const same =
        Math.abs(next.w - base.dims.w) < 1e-3 &&
        Math.abs(next.d - base.dims.d) < 1e-3 &&
        Math.abs(next.h - base.dims.h) < 1e-3;
      const placementDims = same ? undefined : next;

      const probe: Placement = { ...target, dims: placementDims };
      const sized = { ...base, dims: placementDims ?? base.dims };
      const c = clampToRoom(target.x, target.z, probe, sized, get().room);

      commit({
        placements: get().placements.map((p) =>
          p.id === id ? { ...p, dims: placementDims, x: c.x, z: c.z } : p,
        ),
      });
      return { ok: true, dims: next };
    },

    removePlacement: (id) => {
      if (!get().placements.some((p) => p.id === id)) return { ok: false };
      commit({
        placements: get().placements.filter((p) => p.id !== id),
        selectedId: get().selectedId === id ? null : get().selectedId,
      });
      return { ok: true };
    },

    setVariant: (id, variantId) => {
      const target = get().placements.find((p) => p.id === id);
      const product = target && getProduct(target.productId);
      if (!target || !product) return { ok: false };
      if (!product.variants.some((v) => v.id === variantId)) return { ok: false };
      commit({
        placements: get().placements.map((p) => (p.id === id ? { ...p, variantId } : p)),
      });
      return { ok: true };
    },

    setRoomDimensions: (dims) => {
      const room = get().room;
      const width = clampDim(dims.width ?? room.width);
      const length = clampDim(dims.length ?? room.length);
      const height = Math.max(2.2, Math.min(4.5, dims.height ?? room.height));
      const next: Room = {
        ...room,
        width,
        length,
        height,
        openings: room.openings.map((o) => {
          const len = o.wall === "north" || o.wall === "south" ? width : length;
          const w = Math.min(o.width, Math.max(0.4, len - 0.2));
          return {
            ...o,
            width: w,
            offset: clamp(o.offset, 0, Math.max(0, len - w)),
            sill: Math.min(o.sill, Math.max(0, height - 0.4)),
            height: Math.min(o.height, height - Math.min(o.sill, height - 0.4)),
          };
        }),
      };
      const outOfBounds: string[] = [];
      const kept = resolved().map(({ placement, product }) => {
        const c = clampToRoom(placement.x, placement.z, placement, product, next);
        if (Math.abs(c.x - placement.x) > 1e-3 || Math.abs(c.z - placement.z) > 1e-3) {
          outOfBounds.push(placement.id);
        }
        return { ...placement, x: c.x, z: c.z };
      });
      commit({ room: next, placements: kept });
      return { ok: true, outOfBounds };
    },

    addOpening: (kind, wall) => {
      const room = get().room;
      const len = wallLength(room, wall);
      const width = Math.min(kind === "door" ? 0.9 : 1.4, len - 0.4);
      const o: Opening = {
        id: nid(kind === "door" ? "door" : "win"),
        kind,
        wall,
        offset: Math.max(0.2, (len - width) / 2),
        width,
        sill: kind === "door" ? 0 : 0.9,
        height: kind === "door" ? 2.04 : 1.2,
      };
      commit({ room: { ...room, openings: [...room.openings, o] } });
      return { ok: true, id: o.id };
    },

    updateOpening: (id, patch) => {
      const room = get().room;
      const cur = room.openings.find((o) => o.id === id);
      if (!cur) return { ok: false, reason: "no such opening" };
      const kind = patch.kind ?? cur.kind;
      const wall = patch.wall ?? cur.wall;
      const len = wallLength(room, wall);
      const width = clamp(patch.width ?? cur.width, 0.4, len - 0.2);
      const offset = clamp(patch.offset ?? cur.offset, 0, Math.max(0, len - width));
      const sill =
        kind === "door" ? 0 : clamp(patch.sill ?? (cur.sill || 0.9), 0, room.height - 0.4);
      const height = clamp(
        patch.height ?? cur.height,
        kind === "door" ? 1.6 : 0.4,
        room.height - sill,
      );
      const nextO: Opening = { ...cur, kind, wall, width, offset, sill, height };
      commit({
        room: { ...room, openings: room.openings.map((o) => (o.id === id ? nextO : o)) },
      });
      return { ok: true };
    },

    removeOpening: (id) => {
      const room = get().room;
      if (!room.openings.some((o) => o.id === id)) return { ok: false };
      commit({ room: { ...room, openings: room.openings.filter((o) => o.id !== id) } });
      return { ok: true };
    },

    select: (id) => set({ selectedId: id }),
    setView: (view) => set({ view }),
    setUnitSystem: (unitSystem) => set({ unitSystem }),
    setDragging: (dragging) => set({ dragging }),

    pushLog: (entry) =>
      set((s) => ({
        agentLog: [...s.agentLog.slice(-99), { ...entry, id: nid("log"), ts: Date.now() }],
      })),

    undo: () =>
      set((s) => {
        const prev = s.past.at(-1);
        if (!prev) return s;
        return {
          past: s.past.slice(0, -1),
          future: [
            { room: s.room, placements: s.placements, selectedId: s.selectedId },
            ...s.future,
          ],
          room: prev.room,
          placements: prev.placements,
          selectedId: prev.selectedId,
        };
      }),

    redo: () =>
      set((s) => {
        const nextState = s.future[0];
        if (!nextState) return s;
        return {
          past: [...s.past, { room: s.room, placements: s.placements, selectedId: s.selectedId }],
          future: s.future.slice(1),
          room: nextState.room,
          placements: nextState.placements,
          selectedId: nextState.selectedId,
        };
      }),

    reset: () => {
      clearCustomProducts();
      set({ customProducts: [] });
      commit({ room: DEFAULT_ROOM, placements: [], selectedId: null });
    },

    hydrate: (partial) => {
      const customs = partial.customProducts ?? get().customProducts;
      clearCustomProducts();
      for (const p of customs) registerCustomProduct(p);
      set({
        room: partial.room ?? get().room,
        placements: partial.placements ?? get().placements,
        customProducts: customs,
        unitSystem: partial.unitSystem ?? get().unitSystem,
        past: [],
        future: [],
        selectedId: null,
      });
    },
  };
});

function clampDim(v: number): number {
  return Math.max(1.5, Math.min(20, Number.isFinite(v) ? v : 4));
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, v));
}

/** the run of a given wall — north/south span the width, east/west the length */
function wallLength(room: Room, wall: WallSide): number {
  return wall === "north" || wall === "south" ? room.width : room.length;
}
