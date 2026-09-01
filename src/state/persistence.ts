import type { Room, Placement, Product } from "./types";
import type { UnitSystem } from "../lib/units";
import { useStore } from "./store";

const KEY = "roomwright:v1";

export interface SavedLayout {
  version: 2;
  room: Room;
  placements: Placement[];
  customProducts: Product[];
  unitSystem: UnitSystem;
}

export type ImportedLayout = Pick<
  SavedLayout,
  "room" | "placements" | "customProducts" | "unitSystem"
>;

export function snapshot(): SavedLayout {
  const s = useStore.getState();
  return {
    version: 2,
    room: s.room,
    placements: s.placements,
    customProducts: s.customProducts,
    unitSystem: s.unitSystem,
  };
}

export function loadSaved(): Partial<ImportedLayout> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return coerce(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Accept v1 (no customProducts) and v2 layout objects. */
export function coerce(parsed: unknown): ImportedLayout | null {
  const p = parsed as Partial<SavedLayout>;
  if (!p || !p.room || !Array.isArray(p.placements)) return null;
  return {
    room: p.room,
    placements: p.placements,
    customProducts: Array.isArray(p.customProducts) ? p.customProducts : [],
    unitSystem: p.unitSystem ?? "metric",
  };
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

export function parseImport(text: string): ImportedLayout {
  const layout = coerce(JSON.parse(text));
  if (!layout) throw new Error("Not a Roomwright layout file");
  return layout;
}
