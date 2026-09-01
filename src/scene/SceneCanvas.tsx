import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../state/store";
import { roomCenter, roomRadius } from "./geometry";
import { Room } from "./Room";
import { Furniture } from "./Furniture";
import { Controls } from "./Controls";

/** The 3D stage. Synthetic image-based lighting (no HDRI file), one warm key
 *  light standing in for a window, soft contact shadows to ground everything. */
export function SceneCanvas() {
  const room = useStore((s) => s.room);
  const select = useStore((s) => s.select);
  const center = roomCenter(room);
  const radius = roomRadius(room);

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{
        fov: 40,
        position: [center[0] + radius * 1.35, radius * 1.3, center[2] + radius * 1.55],
      }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#f4f3f1"]} />
      <fog attach="fog" args={["#f4f3f1", radius * 3, radius * 7]} />

      <hemisphereLight intensity={0.55} color="#fdfbf6" groundColor="#d8d2c6" />
      <directionalLight
        castShadow
        position={[center[0] - radius * 0.8, room.height * 2.4, center[2] - radius * 0.4]}
        intensity={1.35}
        color="#fff3e2"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-radius * 1.6, radius * 1.6, radius * 1.6, -radius * 1.6, 0.1, room.height * 6]}
        />
      </directionalLight>

      <Environment resolution={256}>
        <group rotation={[0, Math.PI / 3, 0]}>
          <Lightformer
            intensity={1.1}
            form="rect"
            position={[0, 4, -6]}
            scale={[10, 6, 1]}
            color="#fff6ea"
          />
          <Lightformer
            intensity={0.5}
            form="rect"
            position={[-6, 2, 3]}
            scale={[6, 8, 1]}
            color="#eef2f6"
          />
          <Lightformer
            intensity={0.4}
            form="rect"
            position={[6, 3, 3]}
            scale={[6, 8, 1]}
            color="#f6efe6"
          />
        </group>
      </Environment>

      <Room room={room} />
      <Furniture roomWidth={room.width} roomLength={room.length} />

      <ContactShadows
        position={[center[0], 0.002, center[2]]}
        scale={radius * 3}
        resolution={1024}
        blur={2.4}
        opacity={0.42}
        far={room.height}
        color="#4a4235"
      />

      <Controls center={center} radius={radius} />
    </Canvas>
  );
}
