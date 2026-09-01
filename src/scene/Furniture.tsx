import { useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useStore } from "../state/store";
import { resolvePlacements } from "../state/selectors";
import { analyzeLayout, statusMap } from "./clearance";
import { setCursor } from "../lib/cursor";
import { Placement } from "./Placement";

const GRID = 0.05;
const snap = (v: number) => Math.round(v / GRID) * GRID;

interface Props {
  roomWidth: number;
  roomLength: number;
}

type Mode = { kind: "idle" } | { kind: "move"; id: string } | { kind: "rotate"; id: string };

/** Renders every placement and owns the move/rotate gestures. Both raycast to a
 *  transparent floor sheet that is only active mid-gesture, and both freeze the
 *  orbit camera so the room holds still. */
export function Furniture({ roomWidth, roomLength }: Props) {
  const placements = useStore((s) => s.placements);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const movePlacement = useStore((s) => s.movePlacement);
  const rotatePlacement = useStore((s) => s.rotatePlacement);
  const setDragging = useStore((s) => s.setDragging);

  const room = useStore((s) => s.room);
  const resolved = resolvePlacements(placements);
  const status = statusMap(analyzeLayout(resolved, room));

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const grab = useRef<{ dx: number; dz: number }>({ dx: 0, dz: 0 });

  const endGesture = () => {
    setMode({ kind: "idle" });
    setDragging(false);
    setCursor("auto");
  };

  const beginMove = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    const p = placements.find((x) => x.id === id);
    if (!p) return;
    select(id);
    grab.current = { dx: p.x - e.point.x, dz: p.z - e.point.z };
    setMode({ kind: "move", id });
    setDragging(true);
    setCursor("grabbing");
    window.addEventListener("pointerup", endGesture, { once: true });
  };

  const beginRotate = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    select(id);
    setMode({ kind: "rotate", id });
    setDragging(true);
    setCursor("grabbing");
    window.addEventListener("pointerup", endGesture, { once: true });
  };

  const onFloorMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (mode.kind === "move") {
      movePlacement(mode.id, snap(e.point.x + grab.current.dx), snap(e.point.z + grab.current.dz));
    } else if (mode.kind === "rotate") {
      const p = placements.find((x) => x.id === mode.id);
      if (!p) return;
      // aim the piece's front at the pointer
      rotatePlacement(mode.id, Math.atan2(e.point.x - p.x, e.point.z - p.z), true);
    }
  };

  return (
    <group>
      {resolved.map(({ placement, product }) => (
        <Placement
          key={placement.id}
          placement={placement}
          product={product}
          selected={placement.id === selectedId}
          rotating={mode.kind === "rotate" && mode.id === placement.id}
          status={status.get(placement.id) ?? "ok"}
          onGrab={beginMove(placement.id)}
          onRotateGrab={beginRotate(placement.id)}
        />
      ))}

      {mode.kind !== "idle" && (
        <mesh
          rotation-x={-Math.PI / 2}
          position={[roomWidth / 2, 0.02, roomLength / 2]}
          onPointerMove={onFloorMove}
          onPointerUp={endGesture}
        >
          <planeGeometry args={[roomWidth * 4, roomLength * 4]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </group>
  );
}
