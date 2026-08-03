// The category tree now mixes two entity types in one SimpleTreeView:
// resource_categories rows (itemId = raw category UUID, unchanged so
// existing expandedIds/pendingFocus logic keeps working) and, under leaf
// categories, product rows — prefixed so a product's UUID can never be
// mistaken for a category's.
const PRODUCT_ITEM_PREFIX = 'product::';

export type TreeSelection = { type: 'category'; id: string } | { type: 'product'; id: string };

export function makeProductTreeItemId(productId: string): string {
  return `${PRODUCT_ITEM_PREFIX}${productId}`;
}

export function parseTreeItemId(itemId: string): TreeSelection {
  if (itemId.startsWith(PRODUCT_ITEM_PREFIX)) {
    return { type: 'product', id: itemId.slice(PRODUCT_ITEM_PREFIX.length) };
  }
  return { type: 'category', id: itemId };
}
