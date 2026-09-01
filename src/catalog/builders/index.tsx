import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";
import type { BuilderKind, Product, Variant } from "../../state/types";
import { DARK_WOOD, SCREEN_DARK, finishMaterial } from "./material";

interface Mat {
  color: string;
  roughness: number;
  metalness: number;
}

interface BuildArgs {
  product: Product;
  variant: Variant;
}

/** All furniture is authored geometry sized to the catalogue's real dimensions.
 *  Each builder centres the piece on the origin in x/z and stands it on y = 0.
 *  `w` runs along x, `d` along z, `h` up. */

function Box({
  size,
  pos = [0, 0, 0],
  mat,
  radius = 0.02,
  cast = true,
}: {
  size: [number, number, number];
  pos?: [number, number, number];
  mat: Mat;
  radius?: number;
  cast?: boolean;
}) {
  return (
    <RoundedBox
      args={size}
      position={pos}
      radius={Math.min(radius, ...size) / 2}
      smoothness={3}
      castShadow={cast}
      receiveShadow
    >
      <meshStandardMaterial color={mat.color} roughness={mat.roughness} metalness={mat.metalness} />
    </RoundedBox>
  );
}

function Cyl({
  r,
  h,
  pos = [0, 0, 0],
  mat,
  rot,
}: {
  r: number;
  h: number;
  pos?: [number, number, number];
  mat: Mat;
  rot?: [number, number, number];
}) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 16]} />
      <meshStandardMaterial color={mat.color} roughness={mat.roughness} metalness={mat.metalness} />
    </mesh>
  );
}

function legs(w: number, d: number, h: number, inset: number, r: number, mat: Mat): ReactNode {
  const xs = [w / 2 - inset, -(w / 2 - inset)];
  const zs = [d / 2 - inset, -(d / 2 - inset)];
  return xs.flatMap((x) =>
    zs.map((z) => <Cyl key={`${x},${z}`} r={r} h={h} pos={[x, h / 2, z]} mat={mat} />),
  );
}

function sofa({ product, variant }: BuildArgs, arm = 0.16) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  const foot = 0.12;
  const seatH = 0.34;
  return (
    <group>
      {legs(w, d, foot, 0.14, 0.035, DARK_WOOD)}
      <Box
        size={[w - arm * 2, seatH, d - 0.12]}
        pos={[0, foot + seatH / 2, 0.03]}
        mat={m}
        radius={0.1}
      />
      <Box
        size={[w - arm * 2, h - foot - seatH, 0.18]}
        pos={[0, foot + seatH + (h - foot - seatH) / 2, -d / 2 + 0.12]}
        mat={m}
        radius={0.08}
      />
      <Box
        size={[arm, h - foot - 0.14, d]}
        pos={[w / 2 - arm / 2, foot + (h - foot - 0.14) / 2, 0]}
        mat={m}
        radius={0.08}
      />
      <Box
        size={[arm, h - foot - 0.14, d]}
        pos={[-w / 2 + arm / 2, foot + (h - foot - 0.14) / 2, 0]}
        mat={m}
        radius={0.08}
      />
    </group>
  );
}

function chair({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  const seatH = 0.45;
  return (
    <group>
      {legs(w, d, seatH, 0.05, 0.02, m)}
      <Box size={[w, 0.05, d]} pos={[0, seatH, 0]} mat={m} />
      <Box size={[w, h - seatH, 0.05]} pos={[0, seatH + (h - seatH) / 2, -d / 2 + 0.04]} mat={m} />
    </group>
  );
}

function table({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  return (
    <group>
      <Box size={[w, 0.05, d]} pos={[0, h - 0.025, 0]} mat={m} />
      {legs(w, d, h - 0.05, 0.09, 0.035, m)}
    </group>
  );
}

function slab({ product, variant }: BuildArgs, legR = 0.03) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  return (
    <group>
      <Box size={[w, 0.05, d]} pos={[0, h - 0.025, 0]} mat={m} />
      {legs(w, d, h - 0.05, 0.06, legR, m)}
    </group>
  );
}

function bed({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  const frameH = 0.24;
  return (
    <group>
      <Box
        size={[w + 0.06, frameH, d + 0.06]}
        pos={[0, frameH / 2, 0]}
        mat={DARK_WOOD}
        radius={0.03}
      />
      <Box size={[w, 0.28, d - 0.04]} pos={[0, frameH + 0.14, 0.02]} mat={m} radius={0.06} />
      <Box
        size={[w + 0.06, h - frameH - 0.28, 0.1]}
        pos={[0, frameH + 0.14 + (h - frameH - 0.28) / 2, -d / 2 - 0.02]}
        mat={m}
        radius={0.05}
      />
      <Box
        size={[w * 0.42, 0.12, 0.34]}
        pos={[-w * 0.22, frameH + 0.32, -d / 2 + 0.28]}
        mat={{ ...m, color: shade(m.color, 1.12) }}
        radius={0.06}
      />
      <Box
        size={[w * 0.42, 0.12, 0.34]}
        pos={[w * 0.22, frameH + 0.32, -d / 2 + 0.28]}
        mat={{ ...m, color: shade(m.color, 1.12) }}
        radius={0.06}
      />
    </group>
  );
}

function shelf({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  const t = 0.03;
  const bays = 4;
  return (
    <group>
      <Box size={[t, h, d]} pos={[-w / 2 + t / 2, h / 2, 0]} mat={m} />
      <Box size={[t, h, d]} pos={[w / 2 - t / 2, h / 2, 0]} mat={m} />
      <Box size={[w, t, d]} pos={[0, h - t / 2, 0]} mat={m} />
      <Box size={[w, t, t]} pos={[0, t / 2, -d / 2 + t / 2]} mat={m} />
      {Array.from({ length: bays - 1 }, (_, i) => (
        <Box key={i} size={[w - t * 2, t, d]} pos={[0, ((i + 1) / bays) * h, 0]} mat={m} />
      ))}
    </group>
  );
}

function media({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  return (
    <group>
      <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={m} radius={0.02} />
      <Box
        size={[w * 0.72, w * 0.72 * 0.5, 0.03]}
        pos={[0, h + (w * 0.72 * 0.5) / 2 + 0.02, -d / 2 + 0.06]}
        mat={SCREEN_DARK}
        radius={0.005}
      />
      <Box size={[0.5, 0.03, 0.18]} pos={[0, h + 0.015, -d / 2 + 0.06]} mat={DARK_WOOD} />
    </group>
  );
}

function lamp({ product, variant }: BuildArgs) {
  const { h } = product.dims;
  const m = finishMaterial(variant);
  return (
    <group>
      <Cyl r={0.16} h={0.04} pos={[0, 0.02, 0]} mat={m} />
      <Cyl r={0.018} h={h - 0.3} pos={[0, (h - 0.3) / 2, 0]} mat={m} />
      <Cyl r={0.11} h={0.02} pos={[0.16, h - 0.28, 0]} mat={m} rot={[0, 0, 0]} />
      <mesh position={[0.26, h - 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.22, 20, 1, true]} />
        <meshStandardMaterial
          color="#f3ebdc"
          roughness={0.7}
          side={2}
          emissive="#c9a86b"
          emissiveIntensity={0.35}
        />
      </mesh>
      <pointLight position={[0.26, h - 0.18, 0]} intensity={0.5} distance={3} color="#ffdca8" />
    </group>
  );
}

function rug({ product, variant }: BuildArgs) {
  const { w, d } = product.dims;
  const m = finishMaterial(variant);
  return (
    <mesh position={[0, 0.006, 0]} receiveShadow>
      <boxGeometry args={[w, 0.012, d]} />
      <meshStandardMaterial color={m.color} roughness={m.roughness} metalness={0} />
    </mesh>
  );
}

function plant({ product, variant }: BuildArgs) {
  const { h } = product.dims;
  const m = finishMaterial(variant);
  const potH = 0.34;
  return (
    <group>
      <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.15, potH, 20]} />
        <meshStandardMaterial color={m.color} roughness={m.roughness} metalness={m.metalness} />
      </mesh>
      <Cyl
        r={0.025}
        h={h - potH}
        pos={[0, potH + (h - potH) / 2, 0]}
        mat={{ color: "#5b4a33", roughness: 0.8, metalness: 0 }}
      />
      {[
        [0.16, h - 0.5, 0.05],
        [-0.14, h - 0.34, -0.08],
        [0.04, h - 0.14, 0.12],
        [-0.05, h - 0.2, -0.14],
      ].map((p, i) => (
        <mesh
          key={i}
          position={p as [number, number, number]}
          rotation={[0.3, i * 1.6, 0.2]}
          castShadow
        >
          <icosahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial
            color={i % 2 ? "#4f6b3f" : "#5c7a49"}
            roughness={0.85}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function custom({ product, variant }: BuildArgs) {
  const { w, d, h } = product.dims;
  const m = finishMaterial(variant);
  switch (product.shape ?? "box") {
    case "cylinder": {
      const r = Math.min(w, d) / 2;
      return <Cyl r={r} h={h} pos={[0, h / 2, 0]} mat={m} />;
    }
    case "panel":
      return <Box size={[w, h, Math.min(d, 0.08)]} pos={[0, h / 2, 0]} mat={m} radius={0.01} />;
    case "platform":
      return (
        <Box
          size={[w, Math.min(h, 0.3), d]}
          pos={[0, Math.min(h, 0.3) / 2, 0]}
          mat={m}
          radius={0.03}
        />
      );
    default:
      return <Box size={[w, h, d]} pos={[0, h / 2, 0]} mat={m} radius={0.03} />;
  }
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const FURNITURE_BUILDERS: Record<BuilderKind, (a: BuildArgs) => ReactNode> = {
  sofa: (a) => sofa(a),
  armchair: (a) => sofa(a, 0.13),
  chair: (a) => chair(a),
  table: (a) => table(a),
  coffeeTable: (a) => slab(a, 0.035),
  sideTable: (a) => slab(a, 0.025),
  bed: (a) => bed(a),
  rug: (a) => rug(a),
  lamp: (a) => lamp(a),
  shelf: (a) => shelf(a),
  plant: (a) => plant(a),
  screen: (a) => media(a),
  custom: (a) => custom(a),
};

export function FurniturePiece({ product, variant }: BuildArgs) {
  return <>{FURNITURE_BUILDERS[product.kind]({ product, variant })}</>;
}
