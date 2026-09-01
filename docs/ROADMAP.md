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

## Tier 2 — batch one, done (`v2026.09.01.3`)

| Item | Result |
| --- | --- |
| Graphics pass | `@react-three/postprocessing` — mipmap bloom (0.06), soft vignette, SMAA; shadow map pinned to `PCFShadowMap`. Screen-space only, no material-shader patching. Synthetic Lightformer env retained (no HDRI file) |
| Custom parametric primitives | `custom` product kind — box / cylinder / panel / platform, any W/D/H + colour. Catalogue-rail form + `create_custom_item` tool; `list_catalog` returns them; persisted with the layout (save file v2, v1 still loads) |
| Shareable layout URLs | Share menu → "Copy share link"; the whole layout base64url-encoded into `?layout=`. Opening the link hydrates from it instead of localStorage |

Tool count: 17.

## Tier 2 — remaining, genuinely multi-day (after Sept 3)

Each carries real regression risk against a working submission.

| Item | Notes | Effort |
| --- | --- | --- |
| Real glTF furniture | Kenney / Quaternius CC0 packs — the biggest visual jump, but asset sourcing and consistency work. Catalogue, state, tools and UI are already model-agnostic | ~1 day |
| Photo-assisted room setup | Upload a phone photo; the agent asks clarifying questions and places the fixed elements. Needs a vision path; demo-fragile | ~1–2 days |
| L-shaped / polygon rooms | Replace `width × length` with an outline polygon. Touches `geometry.ts`, `clampToRoom`, `clearance.ts`, `suggest.ts`, `Room.tsx` — high regression surface | ~1–2 days |
| glTF / GLB upload | "Bring your own model" — blob URL, auto-centre + scale, confirm dimensions, IndexedDB persistence | ~1–2 days |
| "Render this view" | Path-traced photoreal still via `three-gpu-pathtracer` — heavy dependency | ~1 day |

## Not planned

Real-time AAA rendering, in-browser modelling, multi-room floor plans,
multi-user editing, a real furniture marketplace, mobile-first layout.

## What AAA graphics would actually require

Authored high-poly PBR models with full texture sets, real-time global
illumination or baked lightmaps, area lights with soft shadows, a full
post-processing stack, possibly real-time path tracing, an art director, and
weeks of asset budget. Out of scope. The Tier-2 graphics items get to
"polished archviz-lite", which is the realistic ceiling here.
