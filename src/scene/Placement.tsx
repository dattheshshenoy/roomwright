import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { ClearanceStatus, Placement as PlacementModel, Product } from "../state/types";
import { getVariant } from "../catalog/variants";
import { FurniturePiece } from "../catalog/builders";
import { footprintAABB } from "../lib/geometry";

interface Props {
  placement: PlacementModel;
  product: Product;
  selected: boolean;
  status: ClearanceStatus;
  onGrab: (e: ThreeEvent<PointerEvent>) => void;
}

const MARKER: Record<ClearanceStatus, { color: string; opacity: number }> = {
  ok: { color: "#b5623c", opacity: 0.16 },
  warn: { color: "#8a5d00", opacity: 0.24 },
  bad: { color: "#97302c", opacity: 0.3 },
};

export function Placement({ placement, product, selected, status, onGrab }: Props) {
  const variant = getVariant(product, placement.variantId);
  const showMarker = selected || status !== "ok";
  const marker = MARKER[status === "ok" ? "ok" : status];

  const [halfX, halfZ] = useMemo(() => {
    const b = footprintAABB(placement, product);
    return [(b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2] as const;
  }, [placement, product]);

  return (
    <group position={[placement.x, 0, placement.z]}>
      <group
        rotation-y={placement.rotationY}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          onGrab(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <FurniturePiece product={product} variant={variant} />
      </group>

      {showMarker && (
        <mesh position={[0, 0.008, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[halfX * 2 + 0.12, halfZ * 2 + 0.12]} />
          <meshBasicMaterial
            color={marker.color}
            transparent
            opacity={selected ? marker.opacity + 0.08 : marker.opacity}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
