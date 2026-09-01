import type { Product, Variant } from "../state/types";

export function getVariant(product: Product, variantId: string): Variant {
  return product.variants.find((v) => v.id === variantId) ?? product.variants[0];
}
