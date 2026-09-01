import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useStore } from "../state/store";
import { roomCenter, roomRadius } from "./geometry";
import { Room } from "./Room";
import { Furniture } from "./Furniture";
import { Controls } from "./Controls";

/** The 3D stage. Synthetic image-based lighting (no HDRI file), one warm key
 *  light standing in for a window, real shadow-mapped shadows, and a restrained
 *  post pass — screen-space AO for contact darkening, a whisper of bloom, edge
 *  AA, a soft vignette. */
export function SceneCanvas() {
  const room = useStore((s) => s.room);
  const center = roomCenter(room);
  const radius = roomRadius(room);

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
      camera={{
        fov: 38,
        position: [center[0] + radius * 1.5, radius * 1.12, center[2] + radius * 1.7],
      }}
    >
      <color attach="background" args={["#f2f0ec"]} />
      <fog attach="fog" args={["#f2f0ec", radius * 3.2, radius * 7.5]} />

      <hemisphereLight intensity={0.68} color="#fef7ec" groundColor="#d8d2c6" />
      <directionalLight
        castShadow
        position={[center[0] - radius * 0.7, room.height * 2.6, center[2] - radius * 0.3]}
        intensity={1.55}
        color="#fff1dc"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
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

      <Controls center={center} radius={radius} />

      <EffectComposer enableNormalPass multisampling={0}>
        <N8AO aoRadius={0.5} intensity={1.6} distanceFalloff={1} color="#2a2620" />
        <Bloom intensity={0.06} luminanceThreshold={0.9} luminanceSmoothing={0.4} mipmapBlur />
        <Vignette offset={0.35} darkness={0.34} eskil={false} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
