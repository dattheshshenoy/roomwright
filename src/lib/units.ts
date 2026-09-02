export type UnitSystem = "metric" | "imperial";

const M_PER_FT = 0.3048;

/** Metres to a "6 ft 4 in" style string. */
export function metersToFtIn(m: number): string {
  const totalInches = Math.round((m / M_PER_FT) * 12);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  if (ft === 0) return `${inches} in`;
  if (inches === 0) return `${ft} ft`;
  return `${ft} ft ${inches} in`;
}

/** A single length, formatted for the active unit system. */
export function formatLength(m: number, system: UnitSystem): string {
  return system === "imperial" ? metersToFtIn(m) : `${m.toFixed(2).replace(/\.?0+$/, "")} m`;
}

/** "2.18 x 0.94 m" or "7 ft 2 in x 3 ft 1 in". */
export function formatFootprint(w: number, d: number, system: UnitSystem): string {
  return `${formatLength(w, system)} x ${formatLength(d, system)}`;
}

/** Short unit label for the active system. */
export const unitLabel = (system: UnitSystem): string => (system === "imperial" ? "ft" : "m");

/** Metres → a number in the active unit, rounded for an editable field. */
export const toUnit = (m: number, system: UnitSystem): number =>
  Math.round((system === "imperial" ? m / M_PER_FT : m) * 100) / 100;

/** An editable-field number in the active unit → metres. */
export const toMeters = (v: number, system: UnitSystem): number =>
  system === "imperial" ? v * M_PER_FT : v;

export function formatPrice(usd: number): string {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
