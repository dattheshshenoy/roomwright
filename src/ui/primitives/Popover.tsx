import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  trigger: (open: boolean) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  width?: number;
}

/** Click-to-open panel anchored under its trigger. Closes on outside click or
 *  Escape. No portal — the top bar sits above the canvas already. */
export function Popover({ trigger, children, align = "right", width = 340 }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {trigger(open)}
      </button>
      {open && (
        <div
          className={`animate-rise absolute top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-[0_10px_28px_-10px_rgba(42,42,40,0.14)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{ width }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
