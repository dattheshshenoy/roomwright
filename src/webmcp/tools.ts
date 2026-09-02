import type { ModelContextToolDescriptor } from "./modelContext";
import { DEG, M2, RAD, defineTool } from "./contract";
import { useStore } from "../state/store";
import { computeShoppingList, resolvePlacements } from "../state/selectors";
import { analyzeLayout } from "../scene/clearance";
import { suggestSpots, type Anchor } from "../scene/suggest";
import { CATALOG, getProduct } from "../catalog/catalog";
import { getVariant } from "../catalog/variants";
import type { Category, Placement, Product } from "../state/types";

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

/** Resolve a product by exact id, exact name, or an unambiguous fragment of
 *  either — so an agent can pass "milo" or "coffee table" and not have to guess
 *  the catalogue id. */
function resolveProduct(query: string): { product?: Product; error?: string } {
  const all = [...CATALOG, ...useStore.getState().customProducts];
  const q = query.trim().toLowerCase();
  const exact =
    all.find((p) => p.id.toLowerCase() === q) ?? all.find((p) => p.name.toLowerCase() === q);
  if (exact) return { product: exact };

  const partial = all.filter(
    (p) => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
  );
  if (partial.length === 1) return { product: partial[0] };

  const list = all.map((p) => `${p.id} (${p.name})`).join(", ");
  if (partial.length > 1)
    return {
      error: `"${query}" matches ${partial.length} products: ${partial
        .map((p) => `${p.id} (${p.name})`)
        .join(", ")}. Pass one product_id.`,
    };
  return { error: `no product matches "${query}". Catalogue: ${list}.` };
}

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
      enum: ["seating", "tables", "sleeping", "storage", "lighting", "decor", "custom"],
    }),
  }),
  (args: { category?: Category }) => {
    const all = [...CATALOG, ...useStore.getState().customProducts];
    const items = all.filter((p) => !args.category || p.category === args.category);
    return {
      ok: true,
      summary: `${items.length} product(s)${args.category ? ` in ${args.category}` : ""}.`,
      payload: items.map((p) => ({
        product_id: p.id,
        name: p.name,
        category: p.category,
        custom: p.custom ?? false,
        dims_m: p.dims,
        price_usd: p.price,
        clearance_front_m: p.clearance.front ?? 0,
        variants: p.variants.map((v) => ({ id: v.id, name: v.name })),
      })),
    };
  },
);

/** create_custom_item */
const createCustomItem = defineTool(
  "roomwright_create_custom_item",
  "Make a custom piece from a primitive and place it in the room. shape is box (cabinet, built-in, block), cylinder (column, round pouffe), panel (a thin room divider), or platform (a low step or podium). width/depth/height in metres (cylinder ignores depth). Optional name, hex colour, position and rotation. Returns the new product_id and placement_id.",
  obj(
    {
      shape: str("primitive", { enum: ["box", "cylinder", "panel", "platform"] }),
      width: num("metres"),
      depth: num("metres (ignored for cylinder)"),
      height: num("metres"),
      name: str("optional label"),
      color: str("optional hex, e.g. #8a6a49"),
      x: num("centre x, metres"),
      z: num("centre z, metres"),
      rotation_degrees: num("clockwise from facing +z"),
    },
    ["shape", "width", "height"],
  ),
  (args: {
    shape: "box" | "cylinder" | "panel" | "platform";
    width: number;
    depth?: number;
    height: number;
    name?: string;
    color?: string;
    x?: number;
    z?: number;
    rotation_degrees?: number;
  }) => {
    const made = useStore.getState().createCustom({
      shape: args.shape,
      name: args.name,
      width: args.width,
      depth: args.depth ?? args.width,
      height: args.height,
      color: args.color,
    });
    if (!made.ok || !made.productId) return { ok: false, summary: "could not create custom piece" };

    const res = useStore.getState().addPlacement(made.productId, {
      x: args.x,
      z: args.z,
      rotationY: args.rotation_degrees != null ? RAD(args.rotation_degrees) : undefined,
    });
    if (!res.ok || !res.placementId) return { ok: false, summary: res.reason ?? "placed nothing" };
    const p = useStore.getState().placements.find((x) => x.id === res.placementId)!;
    return {
      ok: true,
      summary: `Created and placed a custom ${args.shape} at (${M2(p.x)}, ${M2(p.z)}) m.`,
      payload: {
        product_id: made.productId,
        placement: describePlacement(p),
        issues: issuesFor(res.placementId),
      },
    };
  },
);

/** add_item */
const addItem = defineTool(
  "roomwright_add_item",
  "Place a piece in the room. Give product_id (from list_catalog). Optional: variant_id, x and z in metres, rotation_degrees. With no position the piece is auto-placed — wall-hugging pieces against the emptiest wall, others near the centre clear of what is there. Returns the new placement_id and any clearance issues it introduces.",
  obj(
    {
      product_id: str("a product_id from list_catalog, its exact name, or an unambiguous part of the name (e.g. \"milo\" or \"coffee table\")"),
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
    const found = resolveProduct(args.product_id);
    if (!found.product) return { ok: false, summary: found.error! };
    const res = useStore.getState().addPlacement(found.product.id, {
      variantId: args.variant_id,
      x: args.x,
      z: args.z,
      rotationY: args.rotation_degrees != null ? RAD(args.rotation_degrees) : undefined,
    });
    if (!res.ok || !res.placementId)
      return { ok: false, summary: res.reason ?? "could not add piece" };
    const p = useStore.getState().placements.find((x) => x.id === res.placementId)!;
    const product = found.product;
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

/** set_opening — add a door/window, or change an existing one */
const setOpening = defineTool(
  "roomwright_set_opening",
  "Add or change a door or window. Omit opening_id to ADD one — give kind (door or window) and wall (north, south, east, west); it starts centred, and you may also pass offset_m, width_m, sill_m or height_m to place it exactly. Pass opening_id (from get_room) to CHANGE that opening — any of wall, offset_m (from the wall's start corner), width_m, sill_m (windows), height_m, or kind. Values are clamped to fit the wall and ceiling.",
  obj({
    opening_id: str("omit to add a new opening; give it to change an existing one"),
    kind: str("door or window", { enum: ["door", "window"] }),
    wall: str("which wall", { enum: ["north", "south", "east", "west"] }),
    offset_m: num("distance from the wall's start corner to the opening's near edge"),
    width_m: num("opening width"),
    sill_m: num("height of the sill above the floor (windows)"),
    height_m: num("opening height"),
  }),
  (args: {
    opening_id?: string;
    kind?: "door" | "window";
    wall?: "north" | "south" | "east" | "west";
    offset_m?: number;
    width_m?: number;
    sill_m?: number;
    height_m?: number;
  }) => {
    const s = useStore.getState();
    const patch = {
      wall: args.wall,
      offset: args.offset_m,
      width: args.width_m,
      sill: args.sill_m,
      height: args.height_m,
      kind: args.kind,
    };

    if (!args.opening_id) {
      if (!args.kind || !args.wall)
        return { ok: false, summary: "to add an opening, give both kind and wall" };
      const added = s.addOpening(args.kind, args.wall);
      if (!added.ok || !added.id) return { ok: false, summary: "could not add opening" };
      const extra =
        args.offset_m != null ||
        args.width_m != null ||
        args.sill_m != null ||
        args.height_m != null;
      if (extra) useStore.getState().updateOpening(added.id, patch);
      return {
        ok: true,
        summary: `Added a ${args.kind} to the ${args.wall} wall.`,
        payload: { opening_id: added.id, openings: openingsPayload() },
      };
    }

    const res = s.updateOpening(args.opening_id, patch);
    if (!res.ok) return { ok: false, summary: res.reason ?? "could not update opening" };
    return {
      ok: true,
      summary: "Opening updated.",
      payload: { opening_id: args.opening_id, openings: openingsPayload() },
    };
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
    product_id: str("optional — a product_id, name, or name fragment, so candidates fit this piece"),
    near: str("optional bias", {
      enum: ["north", "south", "east", "west", "centre", "window", "door"],
    }),
  }),
  (args: { product_id?: string; near?: Anchor }) => {
    const s = useStore.getState();
    let product: Product | undefined;
    if (args.product_id) {
      const found = resolveProduct(args.product_id);
      if (!found.product) return { ok: false, summary: found.error! };
      product = found.product;
    }
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
  'Add another copy of a placed piece — same product and variant. By default the copy is nudged clear of the original. Pass mirror to place it as a mirror image across the room\'s centre line instead: "east-west" for a matching piece on the opposite left/right side (same distance from its wall, heading flipped), "north-south" for front/back. Use "east-west" for a chair on each side of a sofa.',
  obj(
    {
      placement_id: str("from get_room"),
      mirror: str('optional — "east-west" or "north-south"', {
        enum: ["east-west", "north-south"],
      }),
    },
    ["placement_id"],
  ),
  (args: { placement_id: string; mirror?: "east-west" | "north-south" }) => {
    const src = useStore.getState().placements.find((x) => x.id === args.placement_id);
    if (!src) return { ok: false, summary: "no such piece" };
    const room = useStore.getState().room;

    const spot =
      args.mirror === "east-west"
        ? { x: room.width - src.x, z: src.z, rotationY: -src.rotationY }
        : args.mirror === "north-south"
          ? { x: src.x, z: room.length - src.z, rotationY: Math.PI - src.rotationY }
          : { x: src.x + 0.5, z: src.z + 0.5, rotationY: src.rotationY };

    const res = useStore.getState().addPlacement(src.productId, { variantId: src.variantId, ...spot });
    if (!res.ok || !res.placementId)
      return { ok: false, summary: res.reason ?? "could not duplicate" };
    const p = useStore.getState().placements.find((x) => x.id === res.placementId)!;
    const name = getProduct(src.productId)?.name;
    return {
      ok: true,
      summary: `${args.mirror ? "Mirrored" : "Duplicated"} ${name} to (${M2(p.x)}, ${M2(p.z)}) m.`,
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

/** select_item */
const selectItem = defineTool(
  "roomwright_select_item",
  "Highlight a placed piece in the 3D view and open its Inspector panel, so the user can see which piece you are talking about or about to change. Pass no placement_id to clear the selection.",
  obj({ placement_id: str("from get_room; omit to deselect") }),
  (args: { placement_id?: string }) => {
    if (!args.placement_id) {
      useStore.getState().select(null);
      return { ok: true, summary: "Selection cleared." };
    }
    const p = useStore.getState().placements.find((x) => x.id === args.placement_id);
    if (!p) return { ok: false, summary: "no such piece" };
    useStore.getState().select(args.placement_id);
    return {
      ok: true,
      summary: `Selected ${getProduct(p.productId)?.name ?? "the piece"}.`,
      payload: describePlacement(p),
    };
  },
);

/** set_view */
const setSceneView = defineTool(
  "roomwright_set_view",
  "Switch the camera between 'orbit' (an angled 3D view of the room) and 'plan' (looking straight down at the floor plan). Use plan to let the user judge the layout, orbit to show the room.",
  obj({ view: str("orbit or plan", { enum: ["orbit", "plan"] }) }, ["view"]),
  (args: { view: "orbit" | "plan" }) => {
    useStore.getState().setView(args.view === "plan" ? "top" : "orbit");
    return { ok: true, summary: `View set to ${args.view}.` };
  },
);

/** reset_layout */
const resetLayout = defineTool(
  "roomwright_reset_layout",
  "Clear everything and start over: removes every placed piece, every custom piece, and every opening you added, and restores the default room size and its original door and window. Undoable in the app. Use this when the user asks to start fresh.",
  obj({}),
  () => {
    useStore.getState().reset();
    const s = useStore.getState();
    return {
      ok: true,
      summary: `Reset — default room ${M2(s.room.width)} x ${M2(s.room.length)} m, nothing placed.`,
      payload: {
        room: {
          width_m: M2(s.room.width),
          length_m: M2(s.room.length),
          height_m: M2(s.room.height),
          openings: openingsPayload(),
        },
      },
    };
  },
);

export const ROOMWRIGHT_TOOLS: ModelContextToolDescriptor[] = [
  getRoom,
  listCatalog,
  addItem,
  createCustomItem,
  moveItem,
  rotateItem,
  resizeItem,
  setVariant,
  duplicateItem,
  removeItem,
  setRoomDimensions,
  setOpening,
  removeOpening,
  suggestSpot,
  checkLayout,
  getShoppingList,
  selectItem,
  setSceneView,
  resetLayout,
];
