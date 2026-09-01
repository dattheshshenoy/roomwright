import { useRef } from "react";
import { motion } from "motion/react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Cube,
  DownloadSimple,
  GridFour,
  Image,
  UploadSimple,
} from "@phosphor-icons/react";
import { useStore } from "../state/store";
import { exportJSON, parseImport } from "../state/persistence";
import { canvasPNG, downloadFile } from "../lib/download";
import { ToolsBadge } from "./ToolsBadge";

export function TopBar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const unitSystem = useStore((s) => s.unitSystem);
  const setUnitSystem = useStore((s) => s.setUnitSystem);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const hydrate = useStore((s) => s.hydrate);
  const fileInput = useRef<HTMLInputElement>(null);

  const saveImage = async () => {
    const blob = await canvasPNG();
    if (blob) downloadFile("roomwright-layout.png", blob, "image/png");
  };

  const exportLayout = () => downloadFile("roomwright-layout.json", exportJSON());

  const onImportFile = async (file: File) => {
    try {
      hydrate(parseImport(await file.text()));
    } catch (err) {
      useStore.getState().pushLog({
        tool: "import",
        args: { file: file.name },
        ok: false,
        summary: (err as Error).message,
      });
    }
  };

  return (
    <header
      className="relative z-20 flex items-center justify-between border-b border-border bg-surface px-4"
      style={{ boxShadow: "0 1px 0 rgba(42,40,36,0.03), 0 6px 16px -12px rgba(42,40,36,0.14)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-[7px] text-surface"
            style={{ background: "var(--color-text)", boxShadow: "var(--shadow-chip)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 20V10l7-5 7 5v10"
                stroke="var(--color-accent)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path
                d="M5 20h14"
                stroke="var(--color-surface)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Roomwright</span>
          <span className="section-label hidden sm:inline">room planner</span>
        </div>
        <ToolsBadge />
      </div>

      <div className="flex items-center gap-1">
        <Segmented
          options={[
            { value: "orbit", label: "Orbit", icon: <Cube size={14} /> },
            { value: "top", label: "Plan", icon: <GridFour size={14} /> },
          ]}
          value={view}
          onChange={(v) => setView(v as "orbit" | "top")}
        />
        <Segmented
          options={[
            { value: "metric", label: "m" },
            { value: "imperial", label: "ft" },
          ]}
          value={unitSystem}
          onChange={(v) => setUnitSystem(v as "metric" | "imperial")}
        />

        <span className="mx-1 h-5 w-px bg-border" />

        <IconButton label="Undo" disabled={!canUndo} onClick={undo}>
          <ArrowCounterClockwise size={15} />
        </IconButton>
        <IconButton label="Redo" disabled={!canRedo} onClick={redo}>
          <ArrowClockwise size={15} />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-border" />

        <IconButton label="Save image" onClick={saveImage}>
          <Image size={15} />
        </IconButton>
        <IconButton label="Export layout" onClick={exportLayout}>
          <DownloadSimple size={15} />
        </IconButton>
        <IconButton label="Import layout" onClick={() => fileInput.current?.click()}>
          <UploadSimple size={15} />
        </IconButton>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImportFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </header>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative flex rounded-md border border-border bg-surface-sunk p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 flex items-center gap-1.5 rounded-[5px] px-2.5 py-[3px] text-[12px] transition-colors ${
            value === o.value ? "text-text" : "text-text-muted hover:text-text"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join()}`}
              className="absolute inset-0 -z-10 rounded-[5px] border border-border bg-surface"
              style={{ boxShadow: "0 1px 2px rgba(42,40,36,0.06)" }}
              transition={{ type: "spring", stiffness: 480, damping: 34 }}
            />
          )}
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({
  label,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      title={label}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-sunk hover:text-text disabled:pointer-events-none disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
