import { useEffect } from "react";
import { useStore } from "../state/store";

const STEP = Math.PI / 12;

/** Keyboard: R / Shift+R rotate, Delete removes, Escape deselects,
 *  Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo. Ignored while typing in a field. */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;

      const s = useStore.getState();
      const id = s.selectedId;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (!id) {
        if (e.key === "Escape") s.select(null);
        return;
      }
      switch (e.key) {
        case "r":
        case "R":
          s.rotatePlacement(id, e.shiftKey ? -STEP : STEP);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          s.removePlacement(id);
          break;
        case "Escape":
          s.select(null);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
