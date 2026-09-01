import { motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";
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

export function CatalogRail() {
  const addPlacement = useStore((s) => s.addPlacement);
  const unitSystem = useStore((s) => s.unitSystem);

  const groups = ORDER.map((cat) => ({
    cat,
    items: CATALOG.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  let index = 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="section-label">Catalogue</p>
        <p className="mt-0.5 text-[13px] text-text-muted">
          {CATALOG.length} pieces &middot; real dimensions
        </p>
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
                  delay={index++ * 0.018}
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
      transition={{ delay, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        onClick={onAdd}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.985 }}
        transition={spring}
        className="group flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-surface-sunk"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors group-hover:text-text"
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
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: "var(--color-surface-sunk)" }}
        >
          <Plus size={13} weight="bold" />
        </span>
      </motion.button>
    </motion.li>
  );
}
