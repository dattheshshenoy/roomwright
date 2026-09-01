# Design

Aesthetic direction and the token system. Derived from the taste rules in
`design-taste-frontend` and `minimalist-ui`, tuned for a spatial tool rather than
a marketing site.

## Dials

| Dial | Value | Why |
| --- | --- | --- |
| Design variance | 2 / 10 | It is an instrument. Predictable, aligned, symmetrical layout. |
| Motion intensity | 2 / 10 | Motion only to explain a state change. No perpetual animation. |
| Visual density | 5 / 10 | Daily-app spacing. Panels are calm, the canvas is generous. |

## Layout

A fixed three-zone shell, no page scroll:

```
┌──────────────────────────────────────────────────────────┐
│  Top bar — room name, dimensions, view toggle, export     │
├───────────┬──────────────────────────────────┬───────────┤
│  Catalogue│                                  │ Inspector │
│  rail     │           3D canvas              │ + agent   │
│  (left)   │        (fills remaining)         │ log       │
│           │                                  │ (right)   │
└───────────┴──────────────────────────────────┴───────────┘
```

- Rails are `320px`, collapsible to icon width.
- Canvas is never obscured by floating panels. Selection details go to the
  inspector, not a popover.
- Full height via `min-h-[100dvh]`, not `h-screen`.

## Colour

Warm monochrome canvas, one desaturated accent (terracotta), muted pastels for
semantic status only.

```css
--bg:            #FBFBFA;  /* app canvas */
--surface:       #FFFFFF;  /* rails, panels */
--surface-sunk:  #F4F3F1;  /* wells, inputs */
--border:        #E7E5E1;  /* 1px everywhere */
--text:          #2A2A28;  /* primary, never #000 */
--text-muted:    #7A776F;  /* secondary, meta */
--accent:        #B5623C;  /* terracotta, <70% sat — selection, primary action */
--accent-sunk:   #F3E7E0;  /* accent surface */

--ok-bg:   #EDF3EC;  --ok-fg:   #34633A;  /* clearance pass */
--warn-bg: #FBF3DB;  --warn-fg: #8A5D00;  /* tight fit */
--bad-bg:  #FBEBEA;  --bad-fg:  #97302C;  /* collision / won't fit */
```

Dark mode is out of scope for the challenge build.

## Type

- **Sans (UI, body):** `Geist`, self-hosted via `@fontsource-variable/geist`.
- **Mono (all measurements, coordinates, meta):** `Geist Mono`, via
  `@fontsource-variable/geist-mono`.
- No serif. No Inter.
- Scale: `12 / 13 / 15 / 18 / 24 / 32`. Body 15, panel labels 12 with
  `0.04em` tracking, uppercase for section headers only.
- Every dimension, price, and coordinate renders in mono.

## Components

- **Cards:** used only where elevation means hierarchy. Otherwise group with
  `border-t` / `divide-y` and space. Radius `8px`. Border `1px solid --border`.
  Shadow, when justified, is `0 1px 2px rgba(42,42,40,0.04)` — tinted to the bg.
- **Primary button:** solid `--text` bg, `--surface` text, radius `6px`, no
  shadow. Hover lightens; `:active` is `scale(0.98)`.
- **Secondary button:** `1px` border, transparent fill.
- **Inputs:** label above, `gap-2`, sunk surface, `1px` border, mono for numeric.
- **Status badges:** pill, `text-xs`, uppercase `0.05em`, pastel pairs above.
- **Catalogue item:** thumbnail (rendered mini-preview or line glyph), name,
  dimensions in mono. Row, not card. Hover reveals an add affordance.
- **Icons:** `@phosphor-icons/react`, `regular` weight, `1.5` stroke. No emoji.

## Motion

- State-change only. Piece placement: `120ms` position ease. Panel collapse:
  `180ms` width. Entry fades: `opacity` + `translateY(8px)`, `cubic-bezier(0.16,
  1, 0.3, 1)`, `320ms`.
- Transform and opacity only. No layout-property animation.

## Required states

Every data surface ships loading, empty, and error variants:

- **Empty room:** a composed prompt — "This room is empty. Add a piece from the
  left, or ask your agent to furnish it."
- **Loading catalogue:** skeleton rows matching the real row height.
- **Tool error:** inline in the agent log, red, with the failed tool and reason.
- **Won't-fit:** the piece renders in `--bad-fg` outline and the inspector states
  the conflict.
