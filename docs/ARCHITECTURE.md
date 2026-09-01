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
  App.tsx                  the three-zone shell; hydrates + autosaves; ?debug swap
  index.css                Tailwind v4 + the DESIGN.md tokens as @theme vars

  state/
    store.ts               zustand store: room, placements, selection, agentLog,
                           bounded undo/redo; every mutation is one commit path
    types.ts               Room, Product, Placement, Opening, LayoutReport, ...
    selectors.ts           pure derivations: resolvePlacements, resolveSelected,
                           computeShoppingList (take primitives, memoised in UI)
    useLayoutReport.ts     memoised analyzeLayout hook for the UI
    persistence.ts         localStorage load / autosave / JSON import + export

  catalog/
    catalog.ts             the twelve products, real dimensions + variants + price
    variants.ts            variant lookup with fallback
    builders/
      index.tsx            all twelve parametric mesh builders + FurniturePiece
      material.ts          finish -> roughness/metalness; shared wood/screen mats

  scene/
    SceneCanvas.tsx        <Canvas>: renderer, camera, lights, synthetic env,
                           contact shadows
    Room.tsx               parametric walls / floor / openings, dollhouse fade,
                           floor click = deselect
    Furniture.tsx          renders placements, owns drag, feeds status colours
    Placement.tsx          one piece: invisible hit volume + builder + marker
    Controls.tsx           OrbitControls wrapper, eased orbit / plan presets
    geometry.ts            wall frames, wall-solid rects, room centre / radius
    clearance.ts           collisions, clearance zones, blocked openings, walkways

  webmcp/
    modelContext.d.ts      ambient types for the emerging navigator.modelContext
    register.ts            useWebMCPTools — register on mount, unregister on
                           unmount; probes navigator.* and document.*; no-ops
                           cleanly when absent
    contract.ts            defineTool: log every call, shape the result
    tools.ts               the thirteen tool definitions (schema + execute)

  ui/
    TopBar.tsx             view / units toggles, undo/redo, save image, export,
                           import
    CatalogRail.tsx        catalogue grouped by category, click to add
    Inspector.tsx          selected-piece panel or room panel + shopping list
    AgentLog.tsx           every WebMCP call, newest first
    LayoutStatus.tsx       standing health pill under the canvas
    EmptyRoom.tsx          prompt shown until the first piece lands
    DebugPanel.tsx         dev-only tool harness (?debug)
    useShortcuts.ts        R / Delete / Escape / Cmd+Z
    primitives/            Button, Field + NumberInput

  lib/
    units.ts               metres <-> ft/in display + formatting
    geometry.ts            rotated-footprint AABB, room clamp, auto-placement
    id.ts                  short stable ids
    cursor.ts              body cursor helper
    download.ts            file download + canvas -> PNG blob
```

Two places diverge from a strict one-file-per-item layout for readability: the
twelve furniture builders live in one `builders/index.tsx` (they share helpers
and a single material language), and the thirteen tools live in one `webmcp/tools.ts`
(they share the `defineTool` wrapper and schema helpers).

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
  dims?: { w; d; h };       // optional per-placement size override
};

type Store = {
  room: Room;
  placements: Placement[];
  selectedId: string | null;
  agentLog: AgentLogEntry[];   // every tool call: name, args, result, ts
  view: "orbit" | "top";
  // actions — the ONLY way to mutate; tools and UI both call these
  addPlacement, movePlacement, rotatePlacement, resizePlacement, removePlacement,
  setRoomDimensions, setVariant, select, pushLog, undo, redo, reset
};
```

`y` is always derived (floor, or stacked on a surface). Undo/redo is a bounded
history of store snapshots.

## The WebMCP contract

`webmcp/register.ts` runs once on `App` mount inside a `useEffect`, registers
every tool, and unregisters on unmount (so tools never outlive the view). The top
bar's `ToolsBadge` shows the live count and lists each tool with its description
and the current agent-connection state.

Each tool is built by `defineTool(name, description, inputSchema, run)`, which
wraps `run` so every call is logged and the result is shaped for the runtime.

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
| `resize_item` | `{ placement_id, width?, depth?, height? }` | new size; re-clamped; clearance warnings |
| `set_variant` | `{ placement_id, variant_id }` | ok; updated piece |
| `duplicate_item` | `{ placement_id }` | new `placement_id`, offset; clearance warnings |
| `remove_item` | `{ placement_id }` | ok |
| `suggest_spot` | `{ product_id?, near? }` | open floor, clear wall runs, up to three candidate positions |
| `check_layout` | — | collisions, walkway widths below 0.75 m, pieces blocking a door/window |
| `get_shopping_list` | — | placed pieces with quantities, unit price, line and grand total |

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
