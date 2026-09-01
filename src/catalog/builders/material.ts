import type { Variant } from "../../state/types";

interface MatProps {
  color: string;
  roughness: number;
  metalness: number;
}

const BY_FINISH: Record<Variant["finish"], Omit<MatProps, "color">> = {
  fabric: { roughness: 0.92, metalness: 0 },
  leather: { roughness: 0.55, metalness: 0.04 },
  wood: { roughness: 0.55, metalness: 0 },
  metal: { roughness: 0.34, metalness: 0.82 },
  ceramic: { roughness: 0.28, metalness: 0.02 },
  woven: { roughness: 0.96, metalness: 0 },
};

export function finishMaterial(variant: Variant): MatProps {
  return { color: variant.color, ...BY_FINISH[variant.finish] };
}

/** Warm neutral wood for legs and frames, regardless of the piece's variant. */
export const LEG_WOOD: MatProps = { color: "#8a6a49", roughness: 0.6, metalness: 0 };
export const DARK_WOOD: MatProps = { color: "#4b3928", roughness: 0.55, metalness: 0 };
export const SCREEN_DARK: MatProps = { color: "#1b1c1f", roughness: 0.3, metalness: 0.1 };
