import type { CustomShape, Product } from "../state/types";
import { nid } from "../lib/id";

export interface CustomSpec {
  shape: CustomShape;
  name?: string;
  width: number;
  depth: number;
  height: number;
  color?: string;
  wallHugging?: boolean;
}

const SHAPE_NAME: Record<CustomShape, string> = {
  box: "Box",
  cylinder: "Column",
  panel: "Panel",
  platform: "Platform",
};

const clampM = (v: number) => Math.max(0.1, Math.min(8, Number.isFinite(v) ? v : 0.5));

/** Build a Product for a user-defined primitive. Not added to the catalogue —
 *  the store keeps these in a separate list and the catalogue registry indexes
 *  them so every lookup, measurement and clearance check just works. */
export function makeCustomProduct(spec: CustomSpec): Product {
  const w = clampM(spec.width);
  const d =
    spec.shape === "cylinder"
      ? w
      : spec.shape === "panel"
        ? Math.min(clampM(spec.depth), 0.12)
        : clampM(spec.depth);
  const h = spec.shape === "platform" ? Math.min(clampM(spec.height), 0.3) : clampM(spec.height);
  const color = /^#[0-9a-fA-F]{6}$/.test(spec.color ?? "") ? spec.color! : "#b6ada0";
  return {
    id: nid("custom"),
    name: spec.name?.trim() || `${SHAPE_NAME[spec.shape]} ${w.toFixed(2)}×${d.toFixed(2)} m`,
    kind: "custom",
    shape: spec.shape,
    category: "custom",
    dims: { w, d, h },
    price: 0,
    wallHugging: spec.wallHugging ?? spec.shape === "panel",
    clearance: {},
    custom: true,
    variants: [{ id: "default", name: "Finish", color, finish: "wood" }],
  };
}
