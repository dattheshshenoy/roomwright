import type { BuilderKind } from "../state/types";

/** Continuous-line silhouettes of each piece — light iso perspective, drawn on a
 *  24-unit grid, stroke follows currentColor. */
const PATHS: Record<BuilderKind, string> = {
  sofa: "M3 13v4M21 13v4M3 13c0-1.5 1-2 2-2h14c1 0 2 .5 2 2M5 11V8c0-1 .6-1.5 1.5-1.5h11C18.4 6.5 19 7 19 8v3M6 17v1.5M18 17v1.5",
  armchair:
    "M6 13v3M18 13v3M6 13c0-1.3.8-1.8 1.6-1.8h8.8c.8 0 1.6.5 1.6 1.8M8 12V8.5C8 7.6 8.6 7 9.5 7h5C15.4 7 16 7.6 16 8.5V12M8 16v1.4M16 16v1.4",
  chair: "M8 4v8M16 4v8M8 8h8M6 12h12l-.6 6M6 12l-.6 6M7 12v-1c0-.6.4-1 1-1h8c.6 0 1 .4 1 1v1",
  table: "M4 9h16M4 9l-1 3M20 9l1 3M6 9v9M18 9v9",
  coffeeTable: "M3 10h18M4 10l-.7 4M20 10l.7 4M6 10v5M18 10v5",
  sideTable: "M8 8h8M9 8l-1 5M15 8l1 5M12 8v9",
  bed: "M3 12v6M21 12v6M3 12c0-1 .7-1.6 1.6-1.6h14.8c.9 0 1.6.6 1.6 1.6M3 15h18M5 12V8.5C5 7.7 5.6 7 6.5 7h11c.9 0 1.5.7 1.5 1.5V12",
  rug: "M4 8l16 3-3 5-16-3zM7 9.2l11 2M6 11.7l11 2",
  lamp: "M12 20V9M8 20h8M11 5.5l-2.5 3.2h7L13 5.5zM12 3.5v1M12 9v0",
  shelf: "M6 3v18M18 3v18M6 3h12M6 9h12M6 15h12M6 21h12",
  plant:
    "M10 20h4M10.5 20l-.5-6M13.5 20l.5-6M12 14c-2-1-3.5-.5-4.5.5C8.5 12.5 10.5 12 12 13c1.5-1 3.5-.5 4.5 1.5-1-1-2.5-1.5-4.5-.5zM12 13V9",
  screen: "M4 16h16M5 16v3M19 16v3M6 10h12v6H6zM8 8h8",
  custom: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 3v18M4 7.5l8 4.5 8-4.5",
};

export function KindIcon({ kind, size = 18 }: { kind: BuilderKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[kind]} />
    </svg>
  );
}
