import type { Placement, Product } from "./types";
import { getProduct } from "../catalog/catalog";

export interface ResolvedPlacement {
  placement: Placement;
  product: Product;
}

/** The product a placement renders and is measured as — the catalogue product,
 *  with its dimensions replaced by the placement's override when present. */
export function effectiveProduct(placement: Placement, product: Product): Product {
  return placement.dims ? { ...product, dims: placement.dims } : product;
}

export function resolvePlacements(placements: Placement[]): ResolvedPlacement[] {
  const out: ResolvedPlacement[] = [];
  for (const placement of placements) {
    const base = getProduct(placement.productId);
    if (base) out.push({ placement, product: effectiveProduct(placement, base) });
  }
  return out;
}

export function resolveSelected(
  placements: Placement[],
  selectedId: string | null,
): ResolvedPlacement | null {
  if (!selectedId) return null;
  const placement = placements.find((p) => p.id === selectedId);
  const base = placement && getProduct(placement.productId);
  return placement && base ? { placement, product: effectiveProduct(placement, base) } : null;
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
