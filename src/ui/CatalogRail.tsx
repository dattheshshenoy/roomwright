import { motion } from "motion/react";
import { CaretLeft, ListBullets, Plus } from "@phosphor-icons/react";
import { CATALOG } from "../catalog/catalog";
import type { Category, Product } from "../state/types";
import { useStore } from "../state/store";
import { formatFootprint, formatPrice } from "../lib/units";
import { KindIcon } from "./KindIcon";

const ORDER: Category[] = ["seating", "tables", "sleeping", "storage", "lighting", "decor"];
const LABEL: Record<Category, string> = {
  seating: "Seating",
  tables: "Tables",
  sleeping: "Sleeping",
  storage: "Storage",
  lighting: "Lighting",
  decor: "Decor",
};

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
      </div>
    </div>
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
