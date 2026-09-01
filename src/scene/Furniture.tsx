import { useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useStore } from "../state/store";
import { resolvePlacements } from "../state/selectors";
import { collisionSet } from "./clearance";
import { Placement } from "./Placement";

const GRID = 0.05;
const snap = (v: number) => Math.round(v / GRID) * GRID;

interface Props {
  roomWidth: number;
  roomLength: number;
}

/** Renders every placement and owns the drag interaction. Dragging raycasts to a
 *  transparent floor sheet that is only active mid-drag. */
export function Furniture({ roomWidth, roomLength }: Props) {
  const placements = useStore((s) => s.placements);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const movePlacement = useStore((s) => s.movePlacement);

  const resolved = resolvePlacements(placements);
  const colliding = collisionSet(resolved);

  const [dragId, setDragId] = useState<string | null>(null);
  const grab = useRef<{ dx: number; dz: number }>({ dx: 0, dz: 0 });

  const beginDrag = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    const p = placements.find((x) => x.id === id);
    if (!p) return;
    grab.current = { dx: p.x - e.point.x, dz: p.z - e.point.z };
    setDragId(id);
    select(id);
    document.body.style.cursor = "grabbing";
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
  };

  const endDrag = () => {
    setDragId(null);
    document.body.style.cursor = "auto";
  };

  return (
    <group>
      {resolved.map(({ placement, product }) => (
        <Placement
          key={placement.id}
          placement={placement}
          product={product}
          selected={placement.id === selectedId}
          colliding={colliding.has(placement.id)}
          onGrab={beginDrag(placement.id)}
        />
      ))}

      {dragId && (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[roomWidth / 2, 0.02, roomLength / 2]}
          onPointerMove={(e) => {
            e.stopPropagation();
            movePlacement(
              dragId,
              snap(e.point.x + grab.current.dx),
              snap(e.point.z + grab.current.dz),
            );
          }}
          onPointerUp={endDrag}
        >
          <planeGeometry args={[roomWidth * 4, roomLength * 4]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}
