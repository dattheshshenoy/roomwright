# Roomwright

Furnish a room by talking to your AI agent — or by dragging, or both.

Roomwright is a browser-based room planner built for
[The WebMCP Challenge](https://webmcp.devpost.com). You set a room's real
dimensions, pull furniture from a catalogue of pieces with true measurements, and
arrange them directly with the mouse **or** by asking your agent, which places,
moves, and clearance-checks pieces through [WebMCP](https://github.com/webmachinelearning/webmcp)
tools while you watch it render live in 3D and correct it by hand.

No backend. Your room data never leaves the browser.

## Status

In development for the challenge. See [`docs/PLAN.md`](docs/PLAN.md) for phases.

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/VISION.md`](docs/VISION.md) | What it is, who for, the WebMCP thesis, how it targets the judging criteria |
| [`docs/SOUL.md`](docs/SOUL.md) | Product principles — the calls that resolve ambiguity |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Aesthetic direction, colour / type / motion tokens, component specs |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, module layout, state model, the WebMCP tool contract |
| [`docs/PLAN.md`](docs/PLAN.md) | Build phases, commit sequence, scope boundary, risks |
| [`docs/ASSETS.md`](docs/ASSETS.md) | Why furniture is parametric; asset sources and licences |

## The WebMCP tools

Eight tools, registered while the planner is open, unregistered when it closes:

`get_room` · `set_room_dimensions` · `list_catalog` · `add_item` · `move_item` ·
`rotate_item` · `remove_item` · `check_layout`

They operate on semantic state only — products, positions, clearances. They never
drive the camera or the drag handles. Taste and final judgement stay with you.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run typecheck
npm run lint
```

Requires Node 20+. Test WebMCP in ChatGPT's in-app browser, or Chrome 149+ with
`chrome://flags/#enable-webmcp-testing`.

## Licence

[MIT](LICENSE).
