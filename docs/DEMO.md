# Demo

## Submission video (< 3 minutes, with audio)

**0:00 – 0:20 — the room**
Open the live URL. Empty room. Drag the width and length fields in the inspector;
the room resizes live. "This is Roomwright. You furnish a room by talking to your
AI — or by dragging. Both at once."

**0:20 – 1:05 — the agent furnishes it**
Open the same URL in ChatGPT's in-app browser. Prompt:
"Put a three-seat sofa on the long wall, a coffee table in front of it, two lounge
chairs facing the table, and a rug under the whole group."
The agent calls `list_catalog`, then `add_item` five times. Pieces appear and
arrange. Each call shows up in the agent activity log on the right.

**1:05 – 1:35 — clearance feedback**
The status pill reads "1 tight spot". Prompt: "Is anything too close?"
The agent calls `check_layout` and reports the chair is inside the coffee table's
clearance zone. "Move the left chair 30 cm toward the window." `move_item` runs;
the pill goes green. Then nudge the chair by hand to show direct manipulation.

**1:35 – 2:05 — finish and own it**
Prompt: "Swap the sofa to the cognac leather one." `list_catalog` for the variant
id, then `add_item`/`set` — the sofa recolours. Switch to plan view. Open the
shopping list in the inspector: every piece, quantities, total. Click "save image".

**2:05 – 2:35 — why WebMCP**
"The page exposes eight tools — add, move, rotate, remove, resize, check. The
agent only ever touches semantic state: products, positions, clearances in metres.
It never drives the camera or the drag handles. Taste and the final call stay with
me. No backend — the room never leaves the browser."

**2:35 – end**
"Roomwright. The planner your agent operates and you approve."

## Instagram cut (~35 s, vertical)

Fast montage, one continuous take feel:
talk → sofa drops in → chairs swing into place → drag one chair → plan-view spin →
shopping list total. Text overlay: "a room you decorate by talking to AI".

## Recording checklist

- [ ] Clear `localStorage` (fresh room) before the take
- [ ] Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT in-app browser
- [ ] Window at 16:9, inspector and catalogue both visible
- [ ] Agent activity log visible for every tool call
- [ ] Voiceover covers: what it is, how the agent uses WebMCP, the human-in-the-loop split
- [ ] Under 3:00, public YouTube, audio present
