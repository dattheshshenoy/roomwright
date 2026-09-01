import type { Room, Placement } from "./types";
import type { UnitSystem } from "../lib/units";
import { useStore } from "./store";

const KEY = "roomwright:v1";

export interface SavedLayout {
  version: 1;
  room: Room;
  placements: Placement[];
  unitSystem: UnitSystem;
}

function snapshot(): SavedLayout {
  const s = useStore.getState();
  return { version: 1, room: s.room, placements: s.placements, unitSystem: s.unitSystem };
}

export function loadSaved(): Partial<SavedLayout> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLayout;
    if (parsed?.version !== 1 || !parsed.room) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist on every change, debounced a frame. Returns an unsubscribe. */
export function startAutosave(): () => void {
  let queued = 0;
  return useStore.subscribe(() => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot()));
      } catch {
        /* storage unavailable — planner still works, just not remembered */
      }
    });
  });
}

export function exportJSON(): string {
  return JSON.stringify(snapshot(), null, 2);
}

export function parseImport(text: string): Pick<SavedLayout, "room" | "placements" | "unitSystem"> {
  const parsed = JSON.parse(text) as SavedLayout;
  if (!parsed.room || !Array.isArray(parsed.placements)) {
    throw new Error("Not a Roomwright layout file");
  }
  return {
    room: parsed.room,
    placements: parsed.placements,
    unitSystem: parsed.unitSystem ?? "metric",
  };
}
