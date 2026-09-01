import type { ReactNode } from "react";

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
