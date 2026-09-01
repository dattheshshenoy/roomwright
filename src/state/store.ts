import { create } from "zustand";
import type { AgentLogEntry, Placement, Room, ViewMode } from "./types";
import type { UnitSystem } from "../lib/units";
import { getProduct } from "../catalog/catalog";
import { nid } from "../lib/id";
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
  removePlacement: (id: string) => { ok: boolean };
  setVariant: (id: string, variantId: string) => { ok: boolean };
  setRoomDimensions: (dims: Partial<Pick<Room, "width" | "length" | "height">>) => {
    ok: boolean;
    outOfBounds: string[];
  };

  select: (id: string | null) => void;
  setView: (v: ViewMode) => void;
  setUnitSystem: (u: UnitSystem) => void;
  setDragging: (v: boolean) => void;
  pushLog: (entry: Omit<AgentLogEntry, "id" | "ts">) => void;

  undo: () => void;
  redo: () => void;
  reset: () => void;

  hydrate: (partial: Partial<Pick<Store, "room" | "placements" | "unitSystem">>) => void;
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
    selectedId: null,
    agentLog: [],
    view: "orbit",
    unitSystem: "metric",
    dragging: false,
    past: [],
    future: [],

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
      const next: Room = {
        ...room,
        width: clampDim(dims.width ?? room.width),
        length: clampDim(dims.length ?? room.length),
        height: Math.max(2.2, Math.min(4, dims.height ?? room.height)),
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

    reset: () => commit({ room: DEFAULT_ROOM, placements: [], selectedId: null }),

    hydrate: (partial) =>
      set({
        room: partial.room ?? get().room,
        placements: partial.placements ?? get().placements,
        unitSystem: partial.unitSystem ?? get().unitSystem,
        past: [],
        future: [],
        selectedId: null,
      }),
  };
});

function clampDim(v: number): number {
  return Math.max(2, Math.min(12, Number.isFinite(v) ? v : 4));
}
