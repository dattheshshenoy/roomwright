import { useMemo } from "react";
import { useStore } from "./store";
import { resolvePlacements } from "./selectors";
import { analyzeLayout } from "../scene/clearance";
import type { LayoutReport } from "./types";

export function useLayoutReport(): LayoutReport {
  const placements = useStore((s) => s.placements);
  const room = useStore((s) => s.room);
  return useMemo(() => analyzeLayout(resolvePlacements(placements), room), [placements, room]);
}
