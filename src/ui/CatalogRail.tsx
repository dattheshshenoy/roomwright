import { Plus } from "@phosphor-icons/react";
import { CATALOG } from "../catalog/catalog";
import type { Category, Product } from "../state/types";
import { useStore } from "../state/store";
import { formatFootprint, formatPrice } from "../lib/units";

const ORDER: Category[] = ["seating", "tables", "sleeping", "storage", "lighting", "decor"];
const LABEL: Record<Category, string> = {
  seating: "Seating",
  tables: "Tables",
  sleeping: "Sleeping",
  storage: "Storage",
  lighting: "Lighting",
  decor: "Decor",
};

export function CatalogRail() {
  const addPlacement = useStore((s) => s.addPlacement);
  const unitSystem = useStore((s) => s.unitSystem);

  const groups = ORDER.map((cat) => ({
    cat,
    items: CATALOG.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

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
            <h2 className="section-label px-4 pb-1 pt-3">{LABEL[cat]}</h2>
            <ul>
              {items.map((p) => (
                <CatalogItem
                  key={p.id}
                  product={p}
                  unitSystem={unitSystem}
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
  onAdd,
}: {
  product: Product;
  unitSystem: "metric" | "imperial";
  onAdd: () => void;
}) {
  return (
    <li>
      <button
        onClick={onAdd}
        className="group flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-sunk"
      >
        <span
          className="h-7 w-7 shrink-0 rounded-[5px] border border-border"
          style={{ background: product.variants[0].color }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-text">{product.name}</span>
          <span className="tabular block text-[11px] text-text-muted">
            {formatFootprint(product.dims.w, product.dims.d, unitSystem)} &middot;{" "}
            {formatPrice(product.price)}
          </span>
        </span>
        <Plus
          size={15}
          weight="bold"
          className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
    </li>
  );
}
