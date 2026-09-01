import { Gauge } from "@phosphor-icons/react";
import { useEffectiveQuality, useQuality } from "../state/useQuality";
import type { QualitySetting } from "../lib/quality";
import { Popover } from "./primitives/Popover";

const LABEL = { high: "High", medium: "Medium", low: "Low" } as const;

const OPTIONS: { value: QualitySetting; label: string; hint: string }[] = [
  { value: "auto", label: "Auto", hint: "match this device" },
  { value: "high", label: "High", hint: "full-res AO + effects" },
  { value: "medium", label: "Medium", hint: "half-res AO" },
  { value: "low", label: "Low", hint: "no AO, lighter shadows" },
];

export function QualityControl() {
  const setting = useQuality((s) => s.setting);
  const detected = useQuality((s) => s.detected);
  const setSetting = useQuality((s) => s.setSetting);
  const effective = useEffectiveQuality();

  return (
    <Popover
      width={252}
      trigger={(open) => (
        <span
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors ${
            open ? "border-text bg-surface-sunk" : "border-border hover:bg-surface-sunk"
          }`}
        >
          <Gauge size={13} className="text-text-muted" />
          <span className="text-text">{LABEL[effective]}</span>
          {setting === "auto" && <span className="text-text-muted">auto</span>}
        </span>
      )}
    >
      <div className="border-b border-border px-3 py-2.5">
        <p className="text-[12px] text-text">Render quality</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
          Auto reads your GPU and steps down if the framerate drops. Your device detected as{" "}
          <span className="text-text">{LABEL[detected]}</span>.
        </p>
      </div>
      <ul className="p-1">
        {OPTIONS.map((o) => {
          const active = setting === o.value;
          return (
            <li key={o.value}>
              <button
                onClick={() => setSetting(o.value)}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors ${
                  active ? "bg-surface-sunk" : "hover:bg-surface-sunk"
                }`}
              >
                <span className="text-[13px] text-text">{o.label}</span>
                <span className="text-[11px] text-text-muted">{o.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Popover>
  );
}
