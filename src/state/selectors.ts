import type { Placement, Product } from "./types";
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

export function resolveSelected(
  placements: Placement[],
  selectedId: string | null,
): ResolvedPlacement | null {
  if (!selectedId) return null;
  const placement = placements.find((p) => p.id === selectedId);
  const product = placement && getProduct(placement.productId);
  return placement && product ? { placement, product } : null;
}

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

export function computeShoppingList(placements: Placement[]): ShoppingList {
  const byProduct = new Map<string, ShoppingLine>();
  for (const { product } of resolvePlacements(placements)) {
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
