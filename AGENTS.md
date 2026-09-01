# AGENTS.md

Guidance for coding agents working on Roomwright — a WebMCP-driven 3D room
planner. Human-facing docs live in [`docs/`](docs/); read
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173  (append ?debug for the tool harness)
npm run build      # tsc -b && vite build -> dist/
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint .
npm run format     # prettier --write
```

Node 20+. No test framework — verification is type-checking, lint, and a build,
plus manual checks in the browser.

## Before every commit

`npm run typecheck && npm run lint && npm run build` must all pass. Run
`npm run format` too. Conventional commit messages (`feat:`, `fix:`, `docs:`,
`chore:`, `refactor:`).

## Architecture in one screen

- **State** — one `zustand` store (`src/state/store.ts`). Every mutation goes
  through a store action; the UI and the WebMCP tools call the same actions, so
  undo/redo, persistence, and re-render come for free. Derivations in
  `selectors.ts` are pure functions of `placements` — never object-returning
  `useStore` selectors (they cause render loops).
- **Scene** — React Three Fiber, WebGL2. `Room.tsx` builds walls/floor from the
  room dimensions; `Furniture.tsx` owns the move/rotate gestures; `clearance.ts`
  does collision and clearance analysis. Everything is parametric off `room` and
  `product.dims` — nothing is hardcoded to a size.
- **WebMCP** — `src/webmcp/`. `tools.ts` defines every tool via
  `defineTool(name, description, inputSchema, run)`, which logs each call and
  shapes the result. `register.ts` registers them on mount, unregisters on
  unmount, and no-ops cleanly when `navigator.modelContext` is absent.

## Rules that matter

- **Tools are semantic only.** They speak products, placements, positions, and
  clearances in metres. They never touch the camera, selection highlight, drag
  state, or the render tree. Keep it that way.
- **Standalone-first.** The app must work with WebMCP absent. Anything an agent
  can do, a human can reach in the UI.
- **No emojis** in code, markup, or copy. Icons are `@phosphor-icons/react`.
- **Motion** (`motion` / framer) animates `transform` and `opacity` only, with
  spring physics, and nothing perpetual — motion exists to explain a state
  change, never for decoration. See `docs/DESIGN.md` and `docs/SOUL.md`.
- **Furniture is authored geometry**, sized to real dimensions — not glTF (see
  `docs/ASSETS.md`). The catalogue, state, tools, and UI are model-agnostic, so
  swapping in glTF later is contained.

## Roadmap

Planned work, ordered by effort, is in [`docs/ROADMAP.md`](docs/ROADMAP.md).
