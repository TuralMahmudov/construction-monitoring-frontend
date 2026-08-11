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
  // Added 2026-08-04 (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 7.2)
  // — denormalized directly onto the response so any role can see the
  // listing organization without a separate ORGANIZATION_READ-gated lookup.
  organizationName: string | null;
  organizationType: number | null;
  status: number | null;
  active: boolean;
  // Added 2026-08-11 — server-computed convenience flag (avoids an N+1 price
  // lookup per row), same pattern as MyResource.hasPrice.
  hasPrice: boolean;
  // Added 2026-08-10 (FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 5) — only set
  // for resources created through document bulk-processing (bax
  // features/documents); null for directly-created listings.
  documentId: string | null;
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
//
// 2026-08-04 (§ 7.1) reintroduced `name`/`code` directly on this endpoint
// (contains match against the resource's product), plus `regionId`/
// `minPrice`/`maxPrice` filtering by current active price. Server 400s if
// minPrice/maxPrice is sent without regionId — no cross-currency comparison
// exists in this system, so the UI must enforce that pairing too.
export interface ResourceSearchParams {
  product?: string;
  organization?: string;
  status?: number;
  active?: boolean;
  name?: string;
  code?: string;
  regionId?: string;
  minPrice?: number;
  maxPrice?: number;
  // § 5 — filters to the resources created by one document's bulk-processing
  // sessions (the "Bax" audit view).
  documentId?: string;
  page?: number;
  size?: number;
  sort?: string;
}
