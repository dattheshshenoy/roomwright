# Vision

## What Roomwright is

Roomwright is a browser-based room planner where you furnish and arrange a space
by **talking to your AI agent** as much as by dragging with a mouse. You set a
room's real dimensions, pull furniture from a catalogue of pieces with true
measurements, and place them — either directly, or by asking your agent to do it
while you watch and adjust.

It is built for **The WebMCP Challenge** (https://webmcp.devpost.com).

## Who it is for

Anyone deciding how a real room should be laid out before they move furniture or
spend money: people moving into a new place, rearranging a living room, planning a
home-office corner, or laying out an event space. No design software literacy
required — the agent is the on-ramp.

## The WebMCP thesis

A spatial arrangement task is a poor fit for a chat window and a poor fit for a
mouse alone:

- **Chat alone** can't show you the room. You can't judge "too cramped" from a
  paragraph.
- **Mouse alone** means fiddling every object into place and mentally tracking
  clearances and dimensions.

Roomwright uses WebMCP to let both work at once. The page exposes its planning
operations as agent tools — `add_item`, `move_item`, `check_layout`, and so on —
each with a real schema and real execution logic. Your agent composes them into a
layout; you see it render live in 3D and correct it by hand. The agent operates
on **semantic state** (products, positions, clearances); it never drives the
camera or the drag handles. That asymmetry is enforced in the tool surface, and
it is the answer to "why does this need a human": taste and final judgement stay
with you.

This is also a statement about the open web. The planner is a static site with no
backend. Your room data never leaves the browser. The agent you bring is yours.

## What winning looks like

The four judging criteria, and how Roomwright targets each:

| Criterion | Target |
| --- | --- |
| **WebMCP Leverage** | Eight coherent tools that an agent genuinely chains into a full arrangement, with clearance feedback flowing back. Not one toy tool. |
| **Execution** | A complete product: usable end-to-end with zero agent involvement, then better with one. Deployed, fast, no rough edges. |
| **Potential Impact** | A universal, repeat-use task. The pattern ("the tools every planner should expose") generalises. |
| **Creativity & Ambition** | Not another storefront or to-do list. A 3D, direct-manipulation surface an agent co-operates on. |

## Non-goals

Photorealism. A furniture marketplace. Account systems. Multi-user editing.
Mobile-first. These are explicitly out of scope for the challenge build; see
`PLAN.md` for the line between committed scope and later work.
