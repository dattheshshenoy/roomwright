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

export function formatPrice(usd: number): string {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
