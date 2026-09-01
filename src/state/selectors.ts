import type { Placement, Product } from "./types";
import type { Store } from "./store";
import { getProduct } from "../catalog/catalog";

export interface ResolvedPlacement {
  placement: Placement;
  product: Product;
}

export function resolvePlacements(placements: Placement[]): ResolvedPlacement[] {
  const out: ResolvedPlacement[] = [];
  for (const placement of placements) {
    const product = getProduct(placement.productId);
    if (product) out.push({ placement, product });
  }
  return out;
}

export const selectResolved = (s: Store): ResolvedPlacement[] => resolvePlacements(s.placements);

export const selectSelected = (s: Store): ResolvedPlacement | null => {
  if (!s.selectedId) return null;
  const p = s.placements.find((x) => x.id === s.selectedId);
  const product = p && getProduct(p.productId);
  return p && product ? { placement: p, product } : null;
};

export interface ShoppingLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShoppingList {
  lines: ShoppingLine[];
  total: number;
}

export function selectShoppingList(s: Store): ShoppingList {
  const byProduct = new Map<string, ShoppingLine>();
  for (const { product } of resolvePlacements(s.placements)) {
    const existing = byProduct.get(product.id);
    if (existing) {
      existing.quantity += 1;
      existing.lineTotal = existing.quantity * existing.unitPrice;
    } else {
      byProduct.set(product.id, {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        lineTotal: product.price,
      });
    }
  }
  const lines = [...byProduct.values()].sort((a, b) => b.lineTotal - a.lineTotal);
  return { lines, total: lines.reduce((sum, l) => sum + l.lineTotal, 0) };
}
