import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { ClearanceStatus, Placement as PlacementModel, Product } from "../state/types";
import { getVariant } from "../catalog/variants";
import { FurniturePiece } from "../catalog/builders";
import { footprintAABB } from "../lib/geometry";
import { setCursor } from "../lib/cursor";

interface Props {
  placement: PlacementModel;
  product: Product;
  selected: boolean;
  rotating: boolean;
  status: ClearanceStatus;
  onGrab: (e: ThreeEvent<PointerEvent>) => void;
  onRotateGrab: (e: ThreeEvent<PointerEvent>) => void;
}

const MARKER: Record<ClearanceStatus, { color: string; opacity: number }> = {
  ok: { color: "#b5623c", opacity: 0.16 },
  warn: { color: "#8a5d00", opacity: 0.24 },
  bad: { color: "#97302c", opacity: 0.3 },
};

const ACCENT = "#b5623c";

export function Placement({
  placement,
  product,
  selected,
  rotating,
  status,
  onGrab,
  onRotateGrab,
}: Props) {
  const variant = getVariant(product, placement.variantId);
  const showMarker = selected || status !== "ok";
  const marker = MARKER[status];
  const [hoverHandle, setHoverHandle] = useState(false);

  const [halfX, halfZ] = useMemo(() => {
    const b = footprintAABB(placement, product);
    return [(b.maxX - b.minX) / 2, (b.maxZ - b.minZ) / 2] as const;
  }, [placement, product]);

  const hitH = Math.max(product.dims.h, 0.12);
  const ringR = Math.max(halfX, halfZ) + 0.28;
  const gripDist = product.dims.d / 2 + 0.34;

  return (
    <group position={[placement.x, 0, placement.z]}>
      {/* invisible click / move target covering the piece's bounds */}
      <mesh
        position={[0, hitH / 2, 0]}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          onGrab(e);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor("grab");
        }}
        onPointerOut={() => setCursor("auto")}
      >
        <boxGeometry args={[halfX * 2, hitH, halfZ * 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group rotation-y={placement.rotationY}>
        <FurniturePiece product={product} variant={variant} />

        {selected && (
          <group>
            {/* stalk from centre to the rotate grip */}
            <mesh position={[0, 0.14, gripDist / 2]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.006, 0.006, gripDist, 8]} />
              <meshBasicMaterial color={ACCENT} transparent opacity={0.5} />
            </mesh>
            {/* the grip — drag it in a circle to rotate */}
            <mesh
              position={[0, 0.14, gripDist]}
              scale={hoverHandle || rotating ? 1.35 : 1}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                onRotateGrab(e);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverHandle(true);
                setCursor("grab");
              }}
              onPointerOut={() => {
                setHoverHandle(false);
                setCursor("auto");
              }}
            >
              <sphereGeometry args={[0.05, 20, 20]} />
              <meshStandardMaterial color={ACCENT} roughness={0.35} />
            </mesh>
          </group>
        )}
      </group>

      {/* rotation ring — shown while selected, brighter while rotating */}
      {selected && (
        <mesh position={[0, 0.014, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[ringR - 0.012, ringR, 64]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={rotating ? 0.7 : 0.32}
            depthWrite={false}
          />
        </mesh>
      )}

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
