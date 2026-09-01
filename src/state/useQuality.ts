import { create } from "zustand";
import {
  detectQuality,
  loadQualitySetting,
  saveQualitySetting,
  type Quality,
  type QualitySetting,
} from "../lib/quality";

interface QualityStore {
  /** what the user picked; "auto" follows the device */
  setting: QualitySetting;
  /** what the device was detected as */
  detected: Quality;
  /** live downgrade from the framerate monitor while on "auto" (null = none) */
  runtimeCap: Quality | null;
  setSetting: (s: QualitySetting) => void;
  reportSlow: () => void;
  reportOk: () => void;
}

const order: Record<Quality, number> = { low: 0, medium: 1, high: 2 };
const lower = (q: Quality): Quality => (q === "high" ? "medium" : q === "medium" ? "low" : "low");

export const useQuality = create<QualityStore>((set, get) => ({
  setting: loadQualitySetting(),
  detected: detectQuality(),
  runtimeCap: null,
  setSetting: (setting) => {
    saveQualitySetting(setting);
    set({ setting, runtimeCap: null });
  },
  reportSlow: () => {
    if (get().setting !== "auto") return;
    const current = get().runtimeCap ?? get().detected;
    const next = lower(current);
    if (next !== current) set({ runtimeCap: next });
  },
  reportOk: () => {
    /* stay put once downgraded — avoid oscillation */
  },
}));

/** The tier the renderer should actually use right now. */
export function useEffectiveQuality(): Quality {
  const { setting, detected, runtimeCap } = useQuality();
  if (setting !== "auto") return setting;
  const base = detected;
  if (runtimeCap && order[runtimeCap] < order[base]) return runtimeCap;
  return base;
}
