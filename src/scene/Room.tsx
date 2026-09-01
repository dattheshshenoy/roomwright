import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Room as RoomModel } from "../state/types";
import { useStore } from "../state/store";
import { wallFrames, wallSolids, type WallFrame } from "./geometry";

const WALL_T = 0.09;
const BASEBOARD_H = 0.09;

interface Props {
  room: RoomModel;
}

/** Parametric room shell: floor, four walls with real openings, baseboards.
 *  Walls between the camera and the room interior fade so the space stays
 *  readable (the "dollhouse" view). No ceiling. */
export function Room({ room }: Props) {
  const frames = useMemo(() => wallFrames(room), [room]);
  const view = useStore((s) => s.view);

  const wallMats = useMemo(
    () =>
      frames.map(
        () =>
          new THREE.MeshStandardMaterial({
            color: "#f0ece3",
            roughness: 0.96,
            metalness: 0,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
          }),
      ),
    [frames],
  );

  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c9b18c", roughness: 0.82, metalness: 0 }),
    [],
  );

  useFrame(({ camera }) => {
    frames.forEach((f, i) => {
      const mat = wallMats[i];
      let target: number;
      if (view === "top") {
        target = 0;
      } else {
        const point = f.toWorld(f.len / 2, room.height / 2);
        const toCam = new THREE.Vector3(
          camera.position.x - point[0],
          0,
          camera.position.z - point[2],
        ).normalize();
        const dot = toCam.dot(new THREE.Vector3(...f.normal));
        const t = THREE.MathUtils.clamp((dot + 0.15) / 0.7, 0, 1);
        target = t < 0.16 ? 0 : 0.1 + 0.9 * t;
      }
      mat.opacity += (target - mat.opacity) * 0.16;
      mat.visible = mat.opacity > 0.02;
      mat.depthWrite = mat.opacity > 0.6;
    });
  });

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[room.width / 2, 0, room.length / 2]}
        receiveShadow
        material={floorMat}
        onPointerDown={(e) => {
          if (e.button === 0) useStore.getState().select(null);
        }}
      >
        <planeGeometry args={[room.width, room.length]} />
      </mesh>

      {frames.map((f, i) => (
        <WallGroup key={f.side} frame={f} height={room.height} mat={wallMats[i]} />
      ))}
    </group>
  );
}

interface WallProps {
  frame: WallFrame;
  height: number;
  mat: THREE.MeshStandardMaterial;
}

function WallGroup({ frame, height, mat }: WallProps) {
  const solids = useMemo(
    () => wallSolids(frame.len, height, frame.openings),
    [frame.len, height, frame.openings],
  );
  const alongZ = Math.abs(frame.normal[0]) > 0.5; // west / east run along z

  const baseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e2ddd3", roughness: 0.9 }),
    [],
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bcd6de",
        roughness: 0.08,
        metalness: 0.1,
        transparent: true,
        opacity: 0.22,
      }),
    [],
  );

  const box = (u0: number, u1: number, v0: number, v1: number, thickness: number) => {
    const [cx, cy, cz] = frame.toWorld((u0 + u1) / 2, (v0 + v1) / 2);
    const uLen = u1 - u0;
    const vLen = v1 - v0;
    const size: [number, number, number] = alongZ
      ? [thickness, vLen, uLen]
      : [uLen, vLen, thickness];
    const pos: [number, number, number] = [
      cx - frame.normal[0] * (thickness / 2),
      cy,
      cz - frame.normal[2] * (thickness / 2),
    ];
    return { size, pos };
  };

  const baseboard = box(0.02, frame.len - 0.02, 0, BASEBOARD_H, WALL_T + 0.02);

  return (
    <group>
      {solids.map((r, i) => {
        const { size, pos } = box(r.u0, r.u1, r.v0, r.v1, WALL_T);
        return (
          <mesh key={i} position={pos} material={mat} castShadow receiveShadow>
            <boxGeometry args={size} />
          </mesh>
        );
      })}

      <mesh position={baseboard.pos} material={baseMat}>
        <boxGeometry args={baseboard.size} />
      </mesh>

      {frame.openings
        .filter((o) => o.kind === "window")
        .map((o) => {
          const { size, pos } = box(o.offset, o.offset + o.width, o.sill, o.sill + o.height, 0.03);
          return (
            <mesh key={o.id} position={pos} material={glassMat}>
              <boxGeometry args={size} />
            </mesh>
          );
        })}
    </group>
  );
}
