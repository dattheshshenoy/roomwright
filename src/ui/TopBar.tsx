import { useRef } from "react";
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
    <header className="flex items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold tracking-tight">Roomwright</span>
        <span className="section-label">room planner</span>
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
    <div className="flex overflow-hidden rounded-md border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[12px] transition-colors ${
            value === o.value
              ? "bg-surface-sunk text-text"
              : "bg-surface text-text-muted hover:text-text"
          }`}
        >
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
