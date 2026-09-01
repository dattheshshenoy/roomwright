# Assets

## Furniture: parametric, not modelled

Roomwright's furniture is built from code — parametric groups of rounded boxes
and cylinders with PBR materials — not imported glTF models.

Why:

1. **Dimension truth.** The catalogue entry's `dims` *are* the geometry. A
   "1.2 m coffee table" is exactly 1.2 m. No scale mismatch between a downloaded
   model and its stated size.
2. **Zero binary dependencies.** The repo stays small, licence-clean, and builds
   anywhere with no asset pipeline.
3. **One coherent look.** A single material and proportion language across every
   piece reads as a deliberate style, not a bag of mismatched downloads.
4. **Instant variants.** Colour and material swaps are a material prop, not a new
   file.

The builder map (`catalog/builders/index.ts`) keys on `Product.kind`, so swapping
in real glTF models later is a contained change — the catalogue, state, tools,
and UI are all model-agnostic. That path is noted as future work.

## Environment lighting

One indoor HDRI for image-based lighting, self-hosted at `/public/hdr/`.
Source: Poly Haven (CC0). File committed to the repo. 1k resolution, converted to
`.hdr`. If fetching fails at build time, the scene falls back to a three-point
light rig defined in `scene/Canvas.tsx` — no hard dependency on the HDRI.

## Fonts

- Geist and Geist Mono, via `@fontsource-variable/*` (OFL, self-hosted through
  the bundler). No runtime font CDN.

## Licences

| Asset | Source | Licence |
| --- | --- | --- |
| Furniture geometry | Authored for this repo | MIT (repo licence) |
| Indoor HDRI | Poly Haven | CC0 |
| Geist / Geist Mono | Vercel via fontsource | SIL OFL 1.1 |
| Icons | Phosphor Icons | MIT |

No third-party copyrighted material. Everything ships in the public repo.
