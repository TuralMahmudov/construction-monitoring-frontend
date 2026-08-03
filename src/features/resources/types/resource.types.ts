import type { Product } from '../../products/types/product.types';

// Confirmed shape (FRONTEND_AI_PROMPT_PRODUCTS.md § 3.2) — `resource` is an
// organization's "listing" against a `product`: code/name/attributes/unit/
// description live on the embedded `product`, but as of 2026-07-31
// specification/manufacturer/brand/model live directly on the resource
// itself (NOT on resource.product) — the same product can be listed by
// different orgs under different brands.
export interface Resource {
  id: string;
  productId: string;
  product: Product;
  specification: string | null;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  organizationId: string | null;
  status: number | null;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

// POST /api/resources body (§ 3.1). `manufacturer` is mandatory (400 if
// missing/blank), `specification`/`brand`/`model` optional — these are
// listing-specific, not sent to POST /api/products.
export interface ResourceCreateRequest {
  productId: string;
  organizationId?: string | null;
  specification?: string;
  manufacturer: string;
  brand?: string;
  model?: string;
}

// PUT /api/resources/{id} (§ 3.3) — `active` plus the brand fields (a vendor
// correcting their own manufacturer/brand name). `productId`/category/
// attributes/unit remain immutable — that means a different listing.
export interface ResourceUpdateRequest {
  active: boolean;
  specification?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
}

// Query param names confirmed against § 3.4 — name/code/category/
// manufacturer/brand/unit/attributeName/attributeValue moved to
// GET /api/products (bax products/types/product.types.ts ProductSearchParams).
export interface ResourceSearchParams {
  product?: string;
  organization?: string;
  status?: number;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
