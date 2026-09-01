import { useRef } from "react";
import { motion } from "motion/react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretDown,
  CopySimple,
  Cube,
  DownloadSimple,
  Export,
  GridFour,
  Image,
  UploadSimple,
} from "@phosphor-icons/react";
import { useStore } from "../state/store";
import { exportJSON, parseImport } from "../state/persistence";
import { computeShoppingList } from "../state/selectors";
import { canvasPNG, downloadFile } from "../lib/download";
import { formatPrice } from "../lib/units";
import { ToolsBadge } from "./ToolsBadge";
import { Popover } from "./primitives/Popover";

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

  const copyShoppingList = () => {
    const { lines, total } = computeShoppingList(useStore.getState().placements);
    const text =
      lines.length === 0
        ? "Nothing placed yet."
        : [
            ...lines.map((l) => `${l.quantity} x ${l.name} — ${formatPrice(l.lineTotal)}`),
            "",
            `Total: ${formatPrice(total)}`,
          ].join("\n");
    void navigator.clipboard?.writeText(text);
  };

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

        <Popover
          width={220}
          trigger={(o) => (
            <span
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors ${
                o ? "border-text bg-surface-sunk" : "border-border hover:bg-surface-sunk"
              }`}
            >
              <Export size={13} />
              Share
              <CaretDown size={10} weight="bold" className="text-text-muted" />
            </span>
          )}
        >
          <div className="p-1">
            <MenuItem icon={<Image size={14} />} label="Save image (PNG)" onClick={saveImage} />
            <MenuItem
              icon={<DownloadSimple size={14} />}
              label="Export layout (JSON)"
              onClick={exportLayout}
            />
            <MenuItem
              icon={<UploadSimple size={14} />}
              label="Import layout (JSON)"
              onClick={() => fileInput.current?.click()}
            />
            <MenuItem
              icon={<CopySimple size={14} />}
              label="Copy shopping list"
              onClick={copyShoppingList}
            />
          </div>
        </Popover>
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

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-text transition-colors hover:bg-surface-sunk"
    >
      <span className="text-text-muted">{icon}</span>
      {label}
    </button>
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
