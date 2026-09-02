import { useState } from "react";
import { motion } from "motion/react";
import { CaretLeft, ListBullets, Plus, Trash } from "@phosphor-icons/react";
import { CATALOG } from "../catalog/catalog";
import type { Category, CustomShape, Product } from "../state/types";
import { useStore } from "../state/store";
import { formatFootprint, formatPrice, toMeters, toUnit, unitLabel } from "../lib/units";
import { KindIcon } from "./KindIcon";

const ORDER: Category[] = ["seating", "tables", "sleeping", "storage", "lighting", "decor"];
const LABEL: Record<Category, string> = {
  seating: "Seating",
  tables: "Tables",
  sleeping: "Sleeping",
  storage: "Storage",
  lighting: "Lighting",
  decor: "Decor",
  custom: "Custom",
};

const SHAPES: { id: CustomShape; label: string }[] = [
  { id: "box", label: "Box" },
  { id: "cylinder", label: "Column" },
  { id: "panel", label: "Panel" },
  { id: "platform", label: "Platform" },
];

const spring = { type: "spring", stiffness: 320, damping: 30 } as const;

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function CatalogRail({ open, onToggle }: Props) {
  const addPlacement = useStore((s) => s.addPlacement);
  const unitSystem = useStore((s) => s.unitSystem);

  if (!open) {
    return (
      <button
        onClick={onToggle}
        title="Open catalogue"
        className="flex h-full w-full flex-col items-center gap-3 pt-3 text-text-muted transition-colors hover:bg-surface-sunk hover:text-text"
      >
        <ListBullets size={17} />
        <span className="section-label" style={{ writingMode: "vertical-rl" }}>
          Catalogue
        </span>
      </button>
    );
  }

  const groups = ORDER.map((cat) => ({
    cat,
    items: CATALOG.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  let index = 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <p className="section-label flex items-center gap-1.5">
            <ListBullets size={13} />
            Catalogue
          </p>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {CATALOG.length} pieces &middot; real dimensions
          </p>
        </div>
        <button
          onClick={onToggle}
          title="Collapse catalogue"
          className="-mr-1 grid h-6 w-6 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-sunk hover:text-text"
        >
          <CaretLeft size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.map(({ cat, items }) => (
          <section key={cat} className="border-b border-border last:border-0">
            <h2 className="section-label sticky top-0 z-10 bg-surface/90 px-4 pb-1 pt-3 backdrop-blur">
              {LABEL[cat]}
            </h2>
            <ul>
              {items.map((p) => (
                <CatalogItem
                  key={p.id}
                  product={p}
                  unitSystem={unitSystem}
                  delay={index++ * 0.016}
                  onAdd={() => addPlacement(p.id)}
                />
              ))}
            </ul>
          </section>
        ))}

        <CustomSection unitSystem={unitSystem} />
      </div>
    </div>
  );
}

function CustomSection({ unitSystem }: { unitSystem: "metric" | "imperial" }) {
  const customProducts = useStore((s) => s.customProducts);
  const createCustom = useStore((s) => s.createCustom);
  const addPlacement = useStore((s) => s.addPlacement);
  const removeCustom = useStore((s) => s.removeCustom);
  const [open, setOpen] = useState(false);
  const [shape, setShape] = useState<CustomShape>("box");
  const [w, setW] = useState(1);
  const [d, setD] = useState(0.6);
  const [h, setH] = useState(1);
  const [color, setColor] = useState("#8a6a49");

  const create = () => {
    const res = createCustom({ shape, width: w, depth: d, height: h, color });
    if (res.ok && res.productId) addPlacement(res.productId);
    setOpen(false);
  };

  return (
    <section className="border-t border-border">
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <h2 className="section-label">Custom</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border px-2 py-0.5 text-[11px] text-text-muted transition-colors hover:bg-surface-sunk hover:text-text"
        >
          {open ? "Close" : "+ New piece"}
        </button>
      </div>

      {open && (
        <div className="mx-3 mb-2 flex flex-col gap-2 rounded-md border border-border bg-surface-sunk p-3">
          <div className="flex flex-wrap gap-1">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`rounded border px-2 py-0.5 text-[11px] ${
                  shape === s.id
                    ? "border-accent bg-accent-sunk text-text"
                    : "border-border bg-surface text-text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className={`grid gap-1.5 ${shape === "cylinder" ? "grid-cols-3" : "grid-cols-3"}`}>
            <MiniField label="W" value={w} unitSystem={unitSystem} onChange={setW} />
            {shape !== "cylinder" && (
              <MiniField label="D" value={d} unitSystem={unitSystem} onChange={setD} />
            )}
            <MiniField label="H" value={h} unitSystem={unitSystem} onChange={setH} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-border bg-surface"
            />
            <button
              onClick={create}
              className="flex-1 rounded-md bg-text py-1.5 text-[12px] font-medium text-surface transition-colors hover:bg-[#3a3a37]"
            >
              Create &amp; place
            </button>
          </div>
        </div>
      )}

      {customProducts.length === 0 ? (
        <p className="px-4 pb-3 text-[12px] text-text-muted">
          Build a box, column, panel, or platform at any size.
        </p>
      ) : (
        <ul className="pb-2">
          {customProducts.map((p) => (
            <li key={p.id} className="flex items-center gap-2 px-4 py-1.5">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-text-muted"
                style={{
                  boxShadow: "var(--shadow-chip)",
                  background: `linear-gradient(150deg, #ffffff, ${p.variants[0].color}22)`,
                }}
              >
                <KindIcon kind="custom" size={16} />
              </span>
              <button
                onClick={() => addPlacement(p.id)}
                className="min-w-0 flex-1 text-left"
                title="place another"
              >
                <span className="block truncate text-[13px] text-text">{p.name}</span>
                <span className="tabular block text-[11px] text-text-muted">
                  {formatFootprint(p.dims.w, p.dims.d, unitSystem)}
                </span>
              </button>
              <button
                onClick={() => removeCustom(p.id)}
                className="text-text-muted transition-colors hover:text-bad-fg"
                aria-label="delete custom piece"
              >
                <Trash size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MiniField({
  label,
  value,
  unitSystem,
  onChange,
}: {
  label: string;
  value: number;
  unitSystem: "metric" | "imperial";
  onChange: (meters: number) => void;
}) {
  const shown = toUnit(value, unitSystem);
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-text-muted">
        {label} ({unitLabel(unitSystem)})
      </span>
      <input
        type="number"
        step={unitSystem === "imperial" ? 0.25 : 0.1}
        defaultValue={shown}
        key={`${unitSystem}:${shown}`}
        min={0.1}
        max={30}
        onBlur={(e) => onChange(toMeters(Number(e.target.value), unitSystem))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="tabular w-full rounded border border-border bg-surface px-1 py-1 text-[12px] outline-none"
      />
    </label>
  );
}

function CatalogItem({
  product,
  unitSystem,
  delay,
  onAdd,
}: {
  product: Product;
  unitSystem: "metric" | "imperial";
  delay: number;
  onAdd: () => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        onClick={onAdd}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.985 }}
        transition={spring}
        className="group flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-sunk"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-text-muted transition-colors group-hover:text-text"
          style={{
            boxShadow: "var(--shadow-chip)",
            background: `linear-gradient(150deg, #ffffff, ${product.variants[0].color}22)`,
          }}
        >
          <KindIcon kind={product.kind} size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-text">{product.name}</span>
          <span className="tabular block text-[11px] text-text-muted">
            {formatFootprint(product.dims.w, product.dims.d, unitSystem)} &middot;{" "}
            {formatPrice(product.price)}
          </span>
        </span>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-sunk text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
          <Plus size={13} weight="bold" />
        </span>
      </motion.button>
    </motion.li>
  );
}
