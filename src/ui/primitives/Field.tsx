import type { ReactNode } from "react";
import { type UnitSystem, toMeters, toUnit, unitLabel } from "../../lib/units";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="section-label">{label}</span>
      {children}
    </label>
  );
}

export function NumberInput({
  value,
  onCommit,
  min,
  max,
  step = 0.1,
  suffix,
}: {
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface-sunk px-2 py-1.5">
      <input
        type="number"
        defaultValue={value}
        key={value}
        min={min}
        max={max}
        step={step}
        onBlur={(e) => onCommit(Number(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="tabular w-full bg-transparent text-[13px] outline-none"
      />
      {suffix && <span className="tabular text-[11px] text-text-muted">{suffix}</span>}
    </div>
  );
}

/** A length field that stores metres but shows and accepts the active unit, so
 *  switching m ↔ ft rewrites the value instead of leaving a stale number. */
export function LengthInput({
  meters,
  onCommitMeters,
  unitSystem,
  min,
  max,
}: {
  meters: number;
  onCommitMeters: (m: number) => void;
  unitSystem: UnitSystem;
  min?: number;
  max?: number;
}) {
  return (
    <NumberInput
      value={toUnit(meters, unitSystem)}
      min={min != null ? toUnit(min, unitSystem) : undefined}
      max={max != null ? toUnit(max, unitSystem) : undefined}
      step={unitSystem === "imperial" ? 0.25 : 0.05}
      suffix={unitLabel(unitSystem)}
      onCommit={(v) => onCommitMeters(toMeters(v, unitSystem))}
    />
  );
}
