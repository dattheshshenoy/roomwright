import type { ModelContextToolDescriptor } from "./modelContext";
import { DEG, M2, RAD, defineTool } from "./contract";
import { useStore } from "../state/store";
import { computeShoppingList, resolvePlacements } from "../state/selectors";
import { analyzeLayout } from "../scene/clearance";
import { suggestSpots, type Anchor } from "../scene/suggest";
import { CATALOG, getProduct } from "../catalog/catalog";
import { getVariant } from "../catalog/variants";
import type { Category, Placement } from "../state/types";

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const num = (description: string) => ({ type: "number", description });
const str = (description: string, extra: Record<string, unknown> = {}) => ({
  type: "string",
  description,
  ...extra,
});

function describePlacement(p: Placement) {
  const product = getProduct(p.productId);
  if (!product) return null;
  const dims = p.dims ?? product.dims;
  return {
    placement_id: p.id,
    product_id: p.productId,
    name: product.name,
    variant: getVariant(product, p.variantId).name,
    position: { x: M2(p.x), z: M2(p.z) },
    rotation_degrees: DEG(p.rotationY),
    size_m: { w: M2(dims.w), d: M2(dims.d), h: M2(dims.h) },
    resized: p.dims != null,
  };
}

function openingsPayload() {
  return useStore.getState().room.openings.map((o) => ({
    opening_id: o.id,
    kind: o.kind,
    wall: o.wall,
    offset_m: M2(o.offset),
    width_m: M2(o.width),
    sill_m: M2(o.sill),
    height_m: M2(o.height),
  }));
}

function issuesFor(placementId?: string) {
  const s = useStore.getState();
  const report = analyzeLayout(resolvePlacements(s.placements), s.room);
  const named = report.issues
    .filter((i) => !placementId || i.placementId === placementId)
    .map((i) => {
      const p = s.placements.find((x) => x.id === i.placementId);
      const name = p ? getProduct(p.productId)?.name : undefined;
      return { piece: name ?? i.placementId, severity: i.status, note: i.message };
    });
  return named;
}

/** get_room */
const getRoom = defineTool(
  "roomwright_get_room",
  "Return the room's dimensions and openings plus every placed piece with its id, product, variant, position (metres, origin at the near-left corner), and rotation. Call this first to learn what is in the room and to get placement ids.",
  obj({}),
  () => {
    const s = useStore.getState();
    return {
      ok: true,
      summary: `Room ${M2(s.room.width)} x ${M2(s.room.length)} m with ${s.placements.length} piece(s).`,
      payload: {
        room: {
          width_m: M2(s.room.width),
          length_m: M2(s.room.length),
          height_m: M2(s.room.height),
          openings: s.room.openings.map((o) => ({
            opening_id: o.id,
            kind: o.kind,
            wall: o.wall,
            offset_m: M2(o.offset),
            width_m: M2(o.width),
            sill_m: M2(o.sill),
            height_m: M2(o.height),
          })),
        },
        pieces: s.placements.map(describePlacement).filter(Boolean),
      },
    };
  },
);

/** set_room_dimensions */
const setRoomDimensions = defineTool(
  "roomwright_set_room_dimensions",
  "Resize the room. Any of width, length, height in metres (width 1.5-20, length 1.5-20, height 2.2-4.5). Pieces that fall outside the new bounds are pulled back inside and reported.",
  obj({
    width: num("interior width, metres"),
    length: num("interior length, metres"),
    height: num("ceiling height, metres"),
  }),
  (args: { width?: number; length?: number; height?: number }) => {
    const res = useStore.getState().setRoomDimensions(args);
    const room = useStore.getState().room;
    return {
      ok: true,
      summary:
        `Room is now ${M2(room.width)} x ${M2(room.length)} x ${M2(room.height)} m` +
        (res.outOfBounds.length ? `; ${res.outOfBounds.length} piece(s) pulled back inside.` : "."),
      payload: {
        width_m: M2(room.width),
        length_m: M2(room.length),
        height_m: M2(room.height),
        nudged: res.outOfBounds,
      },
    };
  },
);

/** list_catalog */
const listCatalog = defineTool(
  "roomwright_list_catalog",
  "List the furniture catalogue. Optionally filter by category. Each entry has product_id, dimensions (metres), colour/finish variants, price (USD), and the free space the piece needs in front of it.",
  obj({
    category: str("optional filter", {
      enum: ["seating", "tables", "sleeping", "storage", "lighting", "decor"],
    }),
  }),
  (args: { category?: Category }) => {
    const items = CATALOG.filter((p) => !args.category || p.category === args.category);
    return {
      ok: true,
      summary: `${items.length} product(s)${args.category ? ` in ${args.category}` : ""}.`,
      payload: items.map((p) => ({
        product_id: p.id,
        name: p.name,
        category: p.category,
        dims_m: p.dims,
        price_usd: p.price,
        clearance_front_m: p.clearance.front ?? 0,
        variants: p.variants.map((v) => ({ id: v.id, name: v.name })),
      })),
    };
  },
);

/** add_item */
const addItem = defineTool(
  "roomwright_add_item",
  "Place a piece in the room. Give product_id (from list_catalog). Optional: variant_id, x and z in metres, rotation_degrees. With no position the piece is auto-placed — wall-hugging pieces against the emptiest wall, others near the centre clear of what is there. Returns the new placement_id and any clearance issues it introduces.",
  obj(
    {
      product_id: str("from list_catalog"),
      variant_id: str("optional variant id"),
      x: num("centre x, metres"),
      z: num("centre z, metres"),
      rotation_degrees: num("clockwise from facing +z"),
    },
    ["product_id"],
  ),
  (args: {
    product_id: string;
    variant_id?: string;
    x?: number;
    z?: number;
    rotation_degrees?: number;
  }) => {
    const res = useStore.getState().addPlacement(args.product_id, {
      variantId: args.variant_id,
      x: args.x,
      z: args.z,
      rotationY: args.rotation_degrees != null ? RAD(args.rotation_degrees) : undefined,
    });
    if (!res.ok || !res.placementId)
      return { ok: false, summary: res.reason ?? "could not add piece" };
    const p = useStore.getState().placements.find((x) => x.id === res.placementId)!;
    const product = getProduct(args.product_id)!;
    return {
      ok: true,
      summary: `Added ${product.name} at (${M2(p.x)}, ${M2(p.z)}) m.`,
      payload: { placement: describePlacement(p), issues: issuesFor(res.placementId) },
    };
  },
);

/** move_item */
const moveItem = defineTool(
  "roomwright_move_item",
  "Move a placed piece to a new centre position in metres. The position is clamped so the piece stays fully inside the room. Returns whether it was clamped and any clearance issues at the new spot.",
  obj(
    { placement_id: str("from get_room"), x: num("centre x, metres"), z: num("centre z, metres") },
    ["placement_id", "x", "z"],
  ),
  (args: { placement_id: string; x: number; z: number }) => {
    const res = useStore.getState().movePlacement(args.placement_id, args.x, args.z);
    if (!res.ok) return { ok: false, summary: res.reason ?? "could not move piece" };
    const p = useStore.getState().placements.find((x) => x.id === args.placement_id)!;
    return {
      ok: true,
      summary:
        `Moved to (${M2(p.x)}, ${M2(p.z)}) m` + (res.clamped ? " (clamped to fit the room)." : "."),
      payload: {
        placement: describePlacement(p),
        clamped: res.clamped,
        issues: issuesFor(args.placement_id),
      },
    };
  },
);

/** rotate_item */
const rotateItem = defineTool(
  "roomwright_rotate_item",
  "Rotate a placed piece about the vertical axis. degrees is relative by default; set absolute true to set the heading directly. Angles snap to 15-degree steps.",
  obj(
    {
      placement_id: str("from get_room"),
      degrees: num("rotation, degrees"),
      absolute: { type: "boolean" },
    },
    ["placement_id", "degrees"],
  ),
  (args: { placement_id: string; degrees: number; absolute?: boolean }) => {
    const res = useStore
      .getState()
      .rotatePlacement(args.placement_id, RAD(args.degrees), args.absolute);
    if (!res.ok) return { ok: false, summary: "no such piece" };
    const p = useStore.getState().placements.find((x) => x.id === args.placement_id)!;
    return {
      ok: true,
      summary: `Rotated to ${DEG(p.rotationY)} degrees.`,
      payload: describePlacement(p),
    };
  },
);

/** resize_item */
const resizeItem = defineTool(
  "roomwright_resize_item",
  "Override a placed piece's size — width (along its own left-right), depth (front-back), height, in metres. Give any subset; each is clamped to 0.15-8 m. The piece re-renders at the new size and its clearance is recomputed. Setting all three back to the catalogue size clears the override.",
  obj(
    {
      placement_id: str("from get_room"),
      width: num("new width, metres"),
      depth: num("new depth, metres"),
      height: num("new height, metres"),
    },
    ["placement_id"],
  ),
  (args: { placement_id: string; width?: number; depth?: number; height?: number }) => {
    const res = useStore
      .getState()
      .resizePlacement(args.placement_id, { w: args.width, d: args.depth, h: args.height });
    if (!res.ok || !res.dims) return { ok: false, summary: res.reason ?? "could not resize" };
    const p = useStore.getState().placements.find((x) => x.id === args.placement_id)!;
    return {
      ok: true,
      summary: `Resized to ${M2(res.dims.w)} x ${M2(res.dims.d)} x ${M2(res.dims.h)} m.`,
      payload: { placement: describePlacement(p), issues: issuesFor(args.placement_id) },
    };
  },
);

/** remove_item */
const removeItem = defineTool(
  "roomwright_remove_item",
  "Remove a placed piece from the room by its placement_id.",
  obj({ placement_id: str("from get_room") }, ["placement_id"]),
  (args: { placement_id: string }) => {
    const name = getProduct(
      useStore.getState().placements.find((x) => x.id === args.placement_id)?.productId ?? "",
    )?.name;
    const res = useStore.getState().removePlacement(args.placement_id);
    return res.ok
      ? { ok: true, summary: `Removed ${name ?? "the piece"}.` }
      : { ok: false, summary: "no such piece" };
  },
);

/** check_layout */
const checkLayout = defineTool(
  "roomwright_check_layout",
  "Evaluate the current arrangement: overlapping pieces, pieces that block a door or window, pieces that do not have their required free space, and walkways under 0.75 m. Returns an overall status (ok, warn, bad), each issue with the piece it concerns, and the narrowest gap in the room.",
  obj({}),
  () => {
    const s = useStore.getState();
    const report = analyzeLayout(resolvePlacements(s.placements), s.room);
    return {
      ok: true,
      summary:
        report.status === "ok"
          ? "Layout is clear — no conflicts, no tight spots."
          : `Layout status: ${report.status}. ${report.issues.length} issue(s).`,
      payload: {
        status: report.status,
        narrowest_walkway_m: report.narrowestWalkway === null ? null : M2(report.narrowestWalkway),
        issues: issuesFor(),
      },
    };
  },
);

/** add_opening */
const addOpening = defineTool(
  "roomwright_add_opening",
  "Add a door or window to a wall (north, south, east, or west). It is centred on the wall by default; use update_opening to set its exact offset and size. Returns the new opening_id.",
  obj(
    {
      kind: str("door or window", { enum: ["door", "window"] }),
      wall: str("which wall", { enum: ["north", "south", "east", "west"] }),
    },
    ["kind", "wall"],
  ),
  (args: { kind: "door" | "window"; wall: "north" | "south" | "east" | "west" }) => {
    const res = useStore.getState().addOpening(args.kind, args.wall);
    if (!res.ok || !res.id) return { ok: false, summary: "could not add opening" };
    return {
      ok: true,
      summary: `Added a ${args.kind} to the ${args.wall} wall.`,
      payload: { opening_id: res.id, openings: openingsPayload() },
    };
  },
);

/** update_opening */
const updateOpening = defineTool(
  "roomwright_update_opening",
  "Change a door or window. Any of: wall, offset (metres from the wall's start corner), width, sill height (windows), opening height, or kind. Values are clamped to fit the wall and the ceiling.",
  obj(
    {
      opening_id: str("from get_room"),
      wall: str("move to this wall", { enum: ["north", "south", "east", "west"] }),
      offset_m: num("distance from the wall's start corner to the opening's near edge"),
      width_m: num("opening width"),
      sill_m: num("height of the sill above the floor (windows)"),
      height_m: num("opening height"),
      kind: str("door or window", { enum: ["door", "window"] }),
    },
    ["opening_id"],
  ),
  (args: {
    opening_id: string;
    wall?: "north" | "south" | "east" | "west";
    offset_m?: number;
    width_m?: number;
    sill_m?: number;
    height_m?: number;
    kind?: "door" | "window";
  }) => {
    const res = useStore.getState().updateOpening(args.opening_id, {
      wall: args.wall,
      offset: args.offset_m,
      width: args.width_m,
      sill: args.sill_m,
      height: args.height_m,
      kind: args.kind,
    });
    if (!res.ok) return { ok: false, summary: res.reason ?? "could not update opening" };
    return { ok: true, summary: "Opening updated.", payload: { openings: openingsPayload() } };
  },
);

/** remove_opening */
const removeOpening = defineTool(
  "roomwright_remove_opening",
  "Remove a door or window by its opening_id.",
  obj({ opening_id: str("from get_room") }, ["opening_id"]),
  (args: { opening_id: string }) => {
    const res = useStore.getState().removeOpening(args.opening_id);
    return res.ok
      ? { ok: true, summary: "Opening removed.", payload: { openings: openingsPayload() } }
      : { ok: false, summary: "no such opening" };
  },
);

/** suggest_spot */
const suggestSpot = defineTool(
  "roomwright_suggest_spot",
  "Ask where a piece could go. Optionally pass product_id (so the spots actually fit that piece) and near (a wall, the centre, the window, or the door) to bias the result. Returns the total open floor, the longest clear run along each wall, and up to three candidate positions with x/z in metres, a rotation, whether each sits against a wall, and how much clear space surrounds it.",
  obj({
    product_id: str("optional — from list_catalog, so candidates fit this piece"),
    near: str("optional bias", {
      enum: ["north", "south", "east", "west", "centre", "window", "door"],
    }),
  }),
  (args: { product_id?: string; near?: Anchor }) => {
    const s = useStore.getState();
    const product = args.product_id ? getProduct(args.product_id) : undefined;
    if (args.product_id && !product)
      return { ok: false, summary: `unknown product "${args.product_id}"` };
    const report = suggestSpots(s.room, resolvePlacements(s.placements), {
      product,
      near: args.near,
    });
    return {
      ok: true,
      summary:
        report.suggestions.length === 0
          ? "No clear spot found — the room is full or the piece is too big."
          : `${report.suggestions.length} spot(s); ${report.open_floor_m2} m2 open floor.`,
      payload: report,
    };
  },
);

/** set_variant */
const setVariant = defineTool(
  "roomwright_set_variant",
  "Change a placed piece's colour or material. variant_id comes from list_catalog's variants list for that product.",
  obj(
    { placement_id: str("from get_room"), variant_id: str("a variant id for the piece's product") },
    ["placement_id", "variant_id"],
  ),
  (args: { placement_id: string; variant_id: string }) => {
    const res = useStore.getState().setVariant(args.placement_id, args.variant_id);
    if (!res.ok)
      return { ok: false, summary: "no such piece, or that variant is not valid for it" };
    const p = useStore.getState().placements.find((x) => x.id === args.placement_id)!;
    const product = getProduct(p.productId)!;
    return {
      ok: true,
      summary: `${product.name} is now ${getVariant(product, p.variantId).name}.`,
      payload: describePlacement(p),
    };
  },
);

/** duplicate_item */
const duplicateItem = defineTool(
  "roomwright_duplicate_item",
  "Add another copy of a placed piece — same product and variant — offset slightly so it does not overlap. Useful for pairs of chairs, matching side tables, and the like.",
  obj({ placement_id: str("from get_room") }, ["placement_id"]),
  (args: { placement_id: string }) => {
    const src = useStore.getState().placements.find((x) => x.id === args.placement_id);
    if (!src) return { ok: false, summary: "no such piece" };
    const res = useStore.getState().addPlacement(src.productId, {
      variantId: src.variantId,
      x: src.x + 0.5,
      z: src.z + 0.5,
      rotationY: (src.rotationY * 180) / Math.PI,
    });
    if (!res.ok || !res.placementId)
      return { ok: false, summary: res.reason ?? "could not duplicate" };
    const p = useStore.getState().placements.find((x) => x.id === res.placementId)!;
    return {
      ok: true,
      summary: `Duplicated ${getProduct(src.productId)?.name} at (${M2(p.x)}, ${M2(p.z)}) m.`,
      payload: { placement: describePlacement(p), issues: issuesFor(res.placementId) },
    };
  },
);

/** get_shopping_list */
const getShoppingList = defineTool(
  "roomwright_get_shopping_list",
  "The pieces currently in the room as a shopping list — each product with quantity, unit price, and line total, plus the grand total in USD.",
  obj({}),
  () => {
    const list = computeShoppingList(useStore.getState().placements);
    return {
      ok: true,
      summary: `${list.lines.reduce((n, l) => n + l.quantity, 0)} piece(s), ${list.total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} total.`,
      payload: {
        lines: list.lines.map((l) => ({
          product: l.name,
          quantity: l.quantity,
          unit_price_usd: l.unitPrice,
          line_total_usd: l.lineTotal,
        })),
        total_usd: list.total,
      },
    };
  },
);

export const ROOMWRIGHT_TOOLS: ModelContextToolDescriptor[] = [
  getRoom,
  listCatalog,
  addItem,
  moveItem,
  rotateItem,
  resizeItem,
  setVariant,
  duplicateItem,
  removeItem,
  setRoomDimensions,
  addOpening,
  updateOpening,
  removeOpening,
  suggestSpot,
  checkLayout,
  getShoppingList,
];
