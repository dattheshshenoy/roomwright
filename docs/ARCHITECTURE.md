# Architecture

## Stack

| Concern | Choice | Note |
| --- | --- | --- |
| Build | Vite + React 18 + TypeScript | Static output. |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` | WebGL2 renderer. |
| State | `zustand` | One store. UI and WebMCP tools mutate it identically. |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + CSS variables | Tokens from `DESIGN.md` as `:root` vars. |
| Fonts | `@fontsource-variable/geist`, `-geist-mono` | Self-hosted. |
| Icons | `@phosphor-icons/react` | |
| WebMCP | `navigator.modelContext.registerTool` via a thin wrapper | See below. |

No backend. No router (single view). No test framework for the challenge build
(type-checking + manual verification gates instead).

## Module layout

```
src/
  main.tsx                 entry, mounts <App/>
  App.tsx                  the three-zone shell

  state/
    store.ts               zustand store: room, placements, selection, agentLog
    types.ts               Room, Product, Placement, ClearanceReport, ...
    selectors.ts           derived: shoppingList, boundsForPlacement, ...
    persistence.ts         localStorage load/save, JSON import/export

  catalog/
    catalog.ts             the product data (12 pieces, real dimensions)
    builders/              parametric mesh builders, one per product `kind`
      Sofa.tsx  Chair.tsx  Table.tsx  Bed.tsx  Rug.tsx  Lamp.tsx
      Shelf.tsx  Plant.tsx  Screen.tsx
      index.ts             kind -> builder map

  scene/
    Canvas.tsx             <Canvas> config: renderer, camera, lighting, env
    Room.tsx               parametric walls / floor / openings, dollhouse fade
    Furniture.tsx          renders placements, selection outline
    Placement.tsx          one piece: builder + drag + rotate handle
    Controls.tsx           OrbitControls wrapper, view presets (orbit / top)
    grid.ts                floor grid + snap math
    clearance.ts           bounding-box overlap, walkway analysis

  webmcp/
    register.ts            registers all tools on mount, unregisters on unmount
    tools/                 one file per tool, each exports { schema, execute }
      getRoom.ts  setRoomDimensions.ts  listCatalog.ts
      addItem.ts  moveItem.ts  rotateItem.ts  removeItem.ts  checkLayout.ts
    contract.ts            shared zod-style schema helpers, result formatting

  ui/
    TopBar.tsx  CatalogRail.tsx  Inspector.tsx  AgentLog.tsx
    RoomDimensions.tsx  ExportMenu.tsx  EmptyRoom.tsx
    primitives/           Button, Field, Badge, Panel, Skeleton

  lib/
    units.ts               meters <-> ft/in display, formatting
    id.ts                  placement id generation
    screenshot.ts          canvas -> PNG data URL
```

## State model

```ts
type Room = {
  width: number;            // metres, interior
  length: number;
  height: number;
  openings: Opening[];       // door / window on a wall, with offset + size
};

type Product = {
  id: string;               // "sofa-3seat"
  name: string;             // "Halden 3-seater"
  kind: BuilderKind;        // "sofa" -> mesh builder
  category: Category;
  dims: { w: number; d: number; h: number };   // metres
  variants: Variant[];      // colour / material swatches
  price: number;            // USD, for the shopping list
  clearance: { front?: number; sides?: number };  // required free space, metres
};

type Placement = {
  id: string;
  productId: string;
  variantId: string;
  x: number; z: number;     // metres, room-local, origin at a corner
  rotationY: number;        // radians, snapped to 15deg
};

type Store = {
  room: Room;
  placements: Placement[];
  selectedId: string | null;
  agentLog: AgentLogEntry[];   // every tool call: name, args, result, ts
  view: "orbit" | "top";
  // actions — the ONLY way to mutate; tools and UI both call these
  addPlacement, movePlacement, rotatePlacement, removePlacement,
  setRoomDimensions, setVariant, select, pushLog, undo, redo, reset
};
```

`y` is always derived (floor, or stacked on a surface). Undo/redo is a bounded
history of store snapshots.

## The WebMCP contract

`webmcp/register.ts` runs once on `App` mount inside a `useEffect`, registers the
eight tools, and unregisters on unmount (so tools never outlive the view).

Each tool module exports:

```ts
export const schema = { name, description, inputSchema };   // JSON Schema
export async function execute(args): Promise<ToolResult>;   // reads/writes store
```

Rules the tools obey:

- **Semantic only.** Tools speak products, placements, positions, clearances.
  They never touch camera, selection highlight, drag state, or the render tree.
- **Every call is logged.** `execute` wraps its work so the args and a
  human-readable result land in `agentLog` regardless of outcome.
- **Reads return structure, not prose.** `get_room` returns the full room +
  placement list as JSON. `check_layout` returns a typed report.
- **Writes go through store actions** — the same ones the mouse uses — so undo,
  persistence, and re-render all just work.
- **Failures are values.** A collision or out-of-bounds move returns
  `{ ok: false, reason }`, not a throw.

### Tools

| Tool | Input | Result |
| --- | --- | --- |
| `get_room` | — | room dims + openings + every placement with position/rotation/product |
| `set_room_dimensions` | `{ width, length, height }` (metres) | updated room; list of placements now out of bounds |
| `list_catalog` | `{ category? }` | products: id, name, dims, variants, price, required clearance |
| `add_item` | `{ product_id, variant?, position?, rotation? }` | `placement_id`; auto-placed against a free wall if no position; clearance warnings |
| `move_item` | `{ placement_id, position }` | ok / clamped-to-bounds / clearance warnings |
| `rotate_item` | `{ placement_id, degrees }` | ok; snapped angle |
| `remove_item` | `{ placement_id }` | ok |
| `check_layout` | — | collisions, walkway widths below 0.75 m, pieces blocking a door/window |

## Rendering notes

- `<Canvas>` — `shadows`, `dpr={[1, 2]}`, `gl={{ toneMapping: ACESFilmicToneMapping }}`,
  `camera={{ fov: 42 }}`.
- Lighting — one `directionalLight` key with a tuned shadow camera, plus
  `<Environment preset="apartment">` (HDRI self-hosted in `/public/hdr`).
- `<ContactShadows>` under the furniture group.
- Dollhouse — walls between the camera and room centre drop to low opacity each
  frame; ceiling hidden in `orbit`, shown never.
- Furniture — parametric groups of `<RoundedBox>` + cylinders with
  `meshStandardMaterial`. See `ASSETS.md` for why not glTF.
- Selection — `<Outlines>` in `--accent`; collision tints the outline `--bad-fg`.
- Drag — pointer ray to the floor plane, clamp to interior, snap to `0.05 m`
  grid, live clearance recolour.

## Standalone-first

The app is fully operable before WebMCP is wired. A dev-only `DebugPanel`
(hidden behind `?debug`) calls the same store actions the tools call, so the
whole flow is verifiable without an agent. WebMCP registration is purely
additive; if `navigator.modelContext` is absent, the app logs a notice and runs
normally.
