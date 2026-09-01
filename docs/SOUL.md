# Soul

The principles that decide the small calls. When a choice is ambiguous, it should
resolve against this document.

## The feel

Quiet, precise, unhurried. Roomwright is a workshop, not a showroom. The interface
is chrome around a room — it should recede so the space is what you look at. Think
architect's desk: matte surfaces, sharp lines, measurements in a monospace hand,
one warm accent the colour of terracotta.

Nothing pulses, bounces, or demands attention. Motion exists only to explain a
change — a piece settling into place, a panel sliding in. If an animation is
decorative, it is wrong.

## Principles

1. **The room is the document.** Every pixel of UI earns its place by helping you
   see or change the room. Panels are dismissible. The canvas is never crowded.

2. **The human holds the pen.** The agent proposes; you dispose. Every agent
   action is visible as it happens and listed in a log you can read. Nothing is
   irreversible — undo covers agent moves and yours identically.

3. **Real measurements, always.** Furniture has true dimensions. Clearances are
   computed, not vibed. If a sofa won't fit, the app says so before you commit.

4. **Usable with the agent turned off.** Direct manipulation is a first-class
   path, not a fallback. Someone who never opens an agent still has a complete
   planner.

5. **No slop.** No emojis. No stock-photo people. No "Elevate your space." No AI
   purple. No three-equal-cards row. Names, copy, and numbers are specific and
   real. Code is clean enough to read for pleasure.

6. **Own your data.** Everything is local. Layouts save to the browser and export
   as plain JSON. There is no server to trust.

## What we refuse to do

- Add a feature the agent needs but a human can't reach.
- Ship an animation that doesn't communicate.
- Let the tool surface leak rendering concerns (camera, selection highlight,
  drag state) to the agent.
- Fake the demo. What the video shows is what the code does.
