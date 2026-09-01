# Roadmap

Ordered by achievability. The current build (`v2026.09.01.stable`) is complete
and working; everything here is additive. The architecture is already
dimension-driven — `room` is threaded through every calculation and the furniture
builders are parametric off `product.dims` — so several of these are small.

## Tier 1 — done (`v2026.09.01`+)

| Item | Result |
| --- | --- |
| Widen room limits | 1.5–20 m width/length, 2.2–4.5 m height |
| Silence deprecation warnings | Explicit `PCFShadowMap` type + a narrow `console.warn` filter — console is clean |
| Auto-collapse rails on narrow viewports | Both rails collapse below 1100 px; the user stays in control otherwise |
| `resize_item` tool + inspector W/D/H fields | A placement carries an optional `dims` override; `resolvePlacements` swaps it into the product so every builder, measurement and clearance check uses it. "Reset to catalogue" clears it |
| `suggest_spot` tool | Grids the room, reports open floor + longest clear wall runs, returns up to three candidate positions biased toward an optional anchor and fitting an optional product |
| Editable doors and windows | `add_opening` / `update_opening` / `remove_opening` tools + a Doors & windows section in the room inspector; `set_room_dimensions` re-fits openings when the room shrinks |
| Discoverable Share menu | The loose export icons became a labelled menu: save image, export/import layout JSON, copy shopping list |

Tool count: 16.

## Tier 2 — post-submission, in order

| Item | Notes | Effort |
| --- | --- | --- |
| Graphics lift | Real interior HDRI for image-based lighting + `postprocessing` (subtle SSAO, bloom, vignette) | ~half day |
| Custom parametric primitives | A `custom` builder kind: box / cylinder / panel / platform, with a name + W/D/H + colour. Covers built-in wardrobes, ottomans, room dividers. No uploads | ~half day |
| Real glTF furniture | Kenney / Quaternius CC0 packs for a cohesive set — the single biggest visual jump. Catalogue, state, tools and UI are already model-agnostic | ~1 day |
| Photo-assisted room setup | Upload a phone photo; the agent asks clarifying questions and places the fixed elements (door, windows, built-ins). Was the "hero feature" in `VISION.md` | ~1–2 days |
| L-shaped / polygon rooms | Replace `width × length` with an outline polygon. `wallFrames` already abstracts a wall as a run + inward normal; clamping becomes point-in-polygon | ~1–2 days |
| glTF / GLB upload | "Bring your own model" — load from a blob URL, auto-centre + scale to a bounding box, user confirms real-world dimensions so clearance stays honest, persist to IndexedDB | ~1–2 days |
| "Render this view" | A path-traced photoreal still via `three-gpu-pathtracer` — one hero image without real-time cost | ~1 day |
| Shareable layout URLs | Encode the layout in the URL so it is a link; no backend | ~half day |

## Not planned

Real-time AAA rendering, in-browser modelling, multi-room floor plans,
multi-user editing, a real furniture marketplace, mobile-first layout.

## What AAA graphics would actually require

Authored high-poly PBR models with full texture sets, real-time global
illumination or baked lightmaps, area lights with soft shadows, a full
post-processing stack, possibly real-time path tracing, an art director, and
weeks of asset budget. Out of scope. The Tier-2 graphics items get to
"polished archviz-lite", which is the realistic ceiling here.
