import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Placement as PlacementModel, Product } from "../state/types";
import { getVariant } from "../catalog/variants";
import { FurniturePiece } from "../catalog/builders";
import { footprintAABB } from "../lib/geometry";

interface Props {
  placement: PlacementModel;
  product: Product;
  selected: boolean;
  colliding: boolean;
  onGrab: (e: ThreeEvent<PointerEvent>) => void;
}

export function Placement({ placement, product, selected, colliding, onGrab }: Props) {
  const variant = getVariant(product, placement.variantId);

  const halfExtents = useMemo(() => {
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

      {selected && (
        <mesh position={[0, 0.008, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[halfExtents[0] * 2 + 0.12, halfExtents[1] * 2 + 0.12]} />
          <meshBasicMaterial
            color={colliding ? "#97302c" : "#b5623c"}
            transparent
            opacity={colliding ? 0.28 : 0.16}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
