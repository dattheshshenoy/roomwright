# Roomwright

Furnish a room by talking to your AI agent — or by dragging, or both.

Roomwright is a browser-based room planner built for
[The WebMCP Challenge](https://webmcp.devpost.com). You set a room's real
dimensions, pull furniture from a catalogue of pieces with true measurements, and
arrange them directly with the mouse **or** by asking your agent, which places,
moves, and clearance-checks pieces through [WebMCP](https://github.com/webmachinelearning/webmcp)
tools while you watch it render live in 3D and correct it by hand.

No backend. Your room data never leaves the browser.

- **Live:** https://dattheshshenoy.github.io/roomwright/
- **Demo video:** _add YouTube link_

## Try it with an agent

1. Open the live URL in **ChatGPT's in-app browser**, or in **Chrome 149+** with
   `chrome://flags/#enable-webmcp-testing` enabled.
2. Ask, for example: *"Furnish this as a small living room — a sofa on the long
   wall, a coffee table, two chairs facing it, and a rug underneath."*
3. Watch the pieces land, check the agent activity log on the right, and drag
   anything into place yourself.

Without an agent the planner is fully usable on its own — add pieces from the
catalogue, drag to arrange, `R` to rotate, `Delete` to remove.

## The WebMCP tools

Nineteen tools, registered while the planner is open and unregistered (via
`AbortSignal`) when it closes — the top bar shows the live count and lists them:

| Tool | Does |
| --- | --- |
| `roomwright_get_room` | room dimensions, openings, and every placed piece with its id and size |
| `roomwright_list_catalog` | the catalogue — ids, dimensions, variants, price, required clearance |
| `roomwright_add_item` | place a piece by id, name, or name fragment (auto-positioned, or at given x/z/rotation) |
| `roomwright_create_custom_item` | make a box, column, panel or platform at any size and place it |
| `roomwright_move_item` | move a piece; clamped to stay inside the room |
| `roomwright_rotate_item` | rotate a piece, snapped to 15 degrees |
| `roomwright_resize_item` | override a piece's width, depth, or height |
| `roomwright_set_variant` | change a piece's colour or material |
| `roomwright_duplicate_item` | add another copy of a piece — nudged clear, or mirrored to the opposite side |
| `roomwright_remove_item` | remove a piece |
| `roomwright_set_room_dimensions` | resize the room (1.5–20 m) |
| `roomwright_set_opening` | add a door or window, or move / resize an existing one |
| `roomwright_remove_opening` | remove an opening |
| `roomwright_suggest_spot` | where a piece could go — open floor, clear wall runs, candidate positions |
| `roomwright_check_layout` | collisions, blocked doors/windows, clearance, narrowest walkway |
| `roomwright_get_shopping_list` | the placed pieces as a costed shopping list |
| `roomwright_select_item` | highlight a piece and open its Inspector |
| `roomwright_set_view` | switch between orbit and top-down plan |
| `roomwright_reset_layout` | clear everything back to the default room |

They operate on the same store the UI does — products, positions, clearances in
metres, plus the current view and selection. They never move the mouse or type.
Registration code: [`src/webmcp/`](src/webmcp/).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173  (add ?debug for the tool harness)
npm run build      # static output in dist/
npm run typecheck
npm run lint
```

Node 20+. `npm run deploy` publishes to GitHub Pages
(https://dattheshshenoy.github.io/roomwright/). See [`docs/DEPLOY.md`](docs/DEPLOY.md)
— `netlify.toml` is also committed for a zero-config Netlify / Cloudflare Pages
deploy.

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/VISION.md`](docs/VISION.md) | what it is, who for, the WebMCP thesis, judging-criteria targets |
| [`docs/SOUL.md`](docs/SOUL.md) | product principles — the calls that resolve ambiguity |
| [`docs/DESIGN.md`](docs/DESIGN.md) | aesthetic direction, colour / type / motion tokens, component specs |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | stack, module layout, state model, the WebMCP tool contract |
| [`docs/PLAN.md`](docs/PLAN.md) | build phases, commit sequence, scope boundary, risks |
| [`docs/ASSETS.md`](docs/ASSETS.md) | why furniture is parametric; asset sources and licences |
| [`docs/DEMO.md`](docs/DEMO.md) | the submission video script and recording checklist |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | planned improvements, ordered by achievability |

## Where this goes next

See [`docs/ROADMAP.md`](docs/ROADMAP.md). Done: Tier 1 (wider rooms, per-piece
resize, `suggest_spot`, editable doors and windows) and Tier 2 batch one (a
postprocessing pass, custom parametric primitives, shareable layout URLs).
Remaining: real glTF furniture, photo-assisted setup, L-shaped rooms, glTF
upload, a path-traced render mode — the catalogue, state, tools, and UI are
already dimension-driven and model-agnostic.

## Licence

[MIT](LICENSE). All assets are original or CC0 — see [`docs/ASSETS.md`](docs/ASSETS.md).
