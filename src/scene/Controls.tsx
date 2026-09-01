import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useStore } from "../state/store";

interface Props {
  /** room centre + size, so presets frame the whole space */
  center: [number, number, number];
  radius: number;
}

/** Orbit for the walkthrough angle, top-down for a plan view. Switching view
 *  eases the camera to the matching pose. */
export function Controls({ center, radius }: Props) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((s) => s.camera);
  const view = useStore((s) => s.view);
  const target = new THREE.Vector3(...center);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.target.copy(target);

    const dest =
      view === "top"
        ? new THREE.Vector3(center[0], radius * 2.7, center[2] + 0.001)
        : new THREE.Vector3(center[0] + radius * 1.35, radius * 1.3, center[2] + radius * 1.55);

    const from = camera.position.clone();
    const start = performance.now();
    const dur = 420;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(from, dest, e);
      c.update();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, center[0], center[1], center[2], radius]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={radius * 3.5}
      maxPolarAngle={Math.PI / 2 - 0.02}
      target={target}
    />
  );
}
