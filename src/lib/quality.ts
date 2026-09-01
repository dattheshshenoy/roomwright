export type Quality = "high" | "medium" | "low";
export type QualitySetting = "auto" | Quality;

const KEY = "roomwright:quality";

export interface QualityProfile {
  dpr: [number, number];
  ao: boolean;
  aoHalfRes: boolean;
  aoQuality: "low" | "medium";
  shadowMap: number;
  bloom: boolean;
}

export const PROFILE: Record<Quality, QualityProfile> = {
  high: {
    dpr: [1, 2],
    ao: true,
    aoHalfRes: false,
    aoQuality: "medium",
    shadowMap: 2048,
    bloom: true,
  },
  medium: {
    dpr: [1, 1.75],
    ao: true,
    aoHalfRes: true,
    aoQuality: "low",
    shadowMap: 2048,
    bloom: true,
  },
  low: {
    dpr: [1, 1.25],
    ao: false,
    aoHalfRes: true,
    aoQuality: "low",
    shadowMap: 1024,
    bloom: false,
  },
};

/** Best guess from the GPU the browser reports and the core count. Deliberately
 *  conservative — a live framerate check can still nudge it down. */
export function detectQuality(): Quality {
  try {
    const gl =
      document.createElement("canvas").getContext("webgl2") ??
      document.createElement("canvas").getContext("webgl");
    if (!gl) return "low";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const r = (dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "").toLowerCase();
    const cores = navigator.hardwareConcurrency || 4;

    if (/swiftshader|software|llvmpipe|basic render/.test(r)) return "low";
    if (/apple m\d|rtx|radeon rx|arc a\d|geforce (gtx 1[6-9]|rtx)|quadro/.test(r)) return "high";
    if (
      /apple gpu|iris xe|iris plus|uhd graphics|hd graphics 6|vega|radeon graphics|geforce gtx 10|geforce mx/.test(
        r,
      )
    )
      return cores >= 8 ? "high" : "medium";
    return cores >= 8 ? "medium" : "low";
  } catch {
    return "medium";
  }
}

export function loadQualitySetting(): QualitySetting {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "high" || v === "medium" || v === "low" || v === "auto") return v;
  } catch {
    /* ignore */
  }
  return "auto";
}

export function saveQualitySetting(v: QualitySetting): void {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
}
