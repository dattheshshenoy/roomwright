# Roomwright

Furnish a room by talking to your AI agent — or by dragging, or both.

Roomwright is a browser-based room planner built for
[The WebMCP Challenge](https://webmcp.devpost.com). You set a room's real
dimensions, pull furniture from a catalogue of pieces with true measurements, and
arrange them directly with the mouse **or** by asking your agent, which places,
moves, and clearance-checks pieces through [WebMCP](https://github.com/webmachinelearning/webmcp)
tools while you watch it render live in 3D and correct it by hand.

No backend. Your room data never leaves the browser.

- **Live:** _add URL after deploy_
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

Eleven tools, registered while the planner is open and unregistered when it closes
(the top bar shows the live count and lists them):

| Tool | Does |
| --- | --- |
| `roomwright_get_room` | room dimensions, openings, and every placed piece with its id and position |
| `roomwright_list_catalog` | the catalogue — ids, dimensions, variants, price, required clearance |
| `roomwright_add_item` | place a piece (auto-positioned, or at given x/z/rotation) |
| `roomwright_move_item` | move a piece; clamped to stay inside the room |
| `roomwright_rotate_item` | rotate a piece, snapped to 15 degrees |
| `roomwright_set_variant` | change a piece's colour or material |
| `roomwright_duplicate_item` | add another copy of a piece, offset so it doesn't overlap |
| `roomwright_remove_item` | remove a piece |
| `roomwright_set_room_dimensions` | resize the room |
| `roomwright_check_layout` | collisions, blocked doors/windows, clearance, narrowest walkway |
| `roomwright_get_shopping_list` | the placed pieces as a costed shopping list |

They operate on semantic state only — products, positions, clearances in metres.
They never drive the camera or the drag handles. Registration code:
[`src/webmcp/`](src/webmcp/).

## Develop

```bash
npm install
npm run dev        # http://localhost:5173  (add ?debug for the tool harness)
npm run build      # static output in dist/
npm run typecheck
npm run lint
```

Node 20+. Deploys as a static site to Netlify or Cloudflare Pages with no
configuration beyond `netlify.toml` (build `npm run build`, publish `dist`).

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

## Where this goes next

Photo-assisted room setup, L-shaped and multi-room plans, style presets, a
walk-through camera, importing a phone LiDAR scan, and swapping the parametric
furniture for real glTF models — the catalogue, state, tools, and UI are already
model-agnostic.

## Licence

[MIT](LICENSE). All assets are original or CC0 — see [`docs/ASSETS.md`](docs/ASSETS.md).
