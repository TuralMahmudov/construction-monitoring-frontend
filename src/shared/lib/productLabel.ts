// `product.description` is server-generated as "{category name}" (no
// attributes) or "{category name} — {attr: val, ...}" (bax
// project_product_resource_model), while `product.name` defaults to the same
// category name for attribute-driven categories but holds the real,
// user-typed distinguishing identity for name-matched (attributeless)
// categories (bax "Zero-attribute category creation"). So description is
// only more informative than name when it actually carries the "— attr:
// val" suffix; a bare category-name description would otherwise mask a
// meaningful custom name. The em dash separator is the one reliable signal
// for that, since we don't have the category's own name here to compare
// against directly.
export function productDisplayLabel(name: string, description?: string | null): string {
  return description?.includes(' — ') ? description : name;
}
