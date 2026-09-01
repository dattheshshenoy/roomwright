# Build Plan

Deadline: 2026-09-03 13:00 PT. Standalone-first — the app works without an agent
at every stage; WebMCP is additive.

## Phases

| # | Phase | Deliverable | Verify |
| --- | --- | --- | --- |
| 0 | Scaffold | Vite + React + TS + R3F + Tailwind v4, folder skeleton, tokens, lint/format, one placeholder tool registered | `npm run build`, `tsc --noEmit`, dev server serves |
| 1 | Room + scene | Parametric room shell, lighting, environment, contact shadows, orbit + top camera, dollhouse wall fade | build passes; visual check via screenshot / dev server |
| 2 | Catalogue + placement | 12 parametric pieces, catalogue rail, click-to-add, drag-on-floor with snap + bounds, select, rotate handle, delete | add/move/rotate/remove all work via UI |
| 3 | Clearance | Bounding-box collision, walkway analysis, door/window blocking, red-state feedback, dimension readout | overlapping pieces flag; `check_layout` logic unit-checked by hand |
| 4 | WebMCP tools | All 8 tools implemented against store actions, registered on mount, logged | each tool exercised via DebugPanel; then via a real agent if API cooperates |
| 5 | Persistence + export | localStorage autosave/restore, JSON import/export, PNG screenshot, shopping list | reload restores; exports valid |
| 6 | Polish | Inspector, agent log, empty/loading/error states, top bar, keyboard (Del, R, Esc), final type + palette pass | full pre-flight checklist in DESIGN.md |
| 7 | Ship | README with run + demo instructions, deploy to Cloudflare Pages / Netlify, demo script, record | live URL loads in a clean browser |

## Commit sequence

1. `docs:` vision, soul, design, architecture, plan, assets + rewritten README
2. `chore:` scaffold (phase 0)
3. `feat(state):` store, types, catalog data
4. `feat(scene):` room shell, lighting, camera (phase 1)
5. `feat(catalog):` builders + placement interactions (phase 2)
6. `feat(scene):` clearance + measurements (phase 3)
7. `feat(webmcp):` 8 tools + registration (phase 4)
8. `feat(state):` persistence + exports (phase 5)
9. `feat(ui):` polish, agent log, states (phase 6)
10. `docs:` README demo script; `chore:` deploy config (phase 7)

## Committed scope

Rectangular room, adjustable W/L/H, one door + up to two windows. 12 catalogue
pieces with variants. Direct manipulation + 8 tools. Orbit + top view.
Persistence, JSON export, screenshot, shopping list. Agent activity log.

## Out of scope (documented as future work in README)

Photo-assisted setup, L-shaped / multi-room, style presets, walk mode, WebXR,
glTF model import, real product sourcing, dark mode, mobile-first layout,
multi-user.

## Risks

| Risk | Mitigation |
| --- | --- |
| WebMCP API immature / not in ChatGPT in-app browser | Standalone-first; DebugPanel mirrors every tool; graceful no-op if `navigator.modelContext` absent |
| 3D reads as childish | Parametric pieces with disciplined proportions + `Environment` + contact shadows + ACES + terracotta-on-bone palette; DESIGN.md pre-flight |
| Drag interaction fiddly | Grid snap, bounds clamp, verified at phase 2 |
| Scope creep | Out-of-scope list is fixed; stretch items only after phase 7 |
| Asset fetch unreliable in build env | Procedural furniture — zero binary dependencies (see ASSETS.md) |
