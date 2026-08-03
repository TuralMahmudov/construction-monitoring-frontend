import type { ProductAttributeInput } from '../../products/types/product.types';
import type { MyResourcePrice } from './price.types';

// Status is entirely backend-assigned — the frontend never computes or sets
// it, only renders whatever `status`/`statusLabel` a resource carries
// (bax MY_RESOURCES_BACKEND_CONTRACT.md). REJECTED/APPROVED are accepted by
// the UI today even though only DRAFT/SUBMITTED/CLARIFICATION_NEEDED are
// expected to be emitted initially, so display never has to change later.
export const RESOURCE_STATUS = {
  DRAFT: 1,
  SUBMITTED: 2,
  CLARIFICATION_NEEDED: 3,
  APPROVED: 4,
  REJECTED: 5,
} as const;

export type ResourceStatus = (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS];

export const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  1: 'Qaralama',
  2: 'Təqdim edilib',
  3: 'Dəqiqləşdirmə tələb olunur',
  4: 'Təsdiqlənib',
  5: 'Rədd edilib',
};

// The resource an organization submitted, as returned by GET /api/resources/mine.
// `hasPrice` is a server-computed convenience flag (avoids an N+1 price
// lookup per row just to render the table's price indicator). `productId`
// was added by the 2026-07-30 backend split (bax FRONTEND_AI_PROMPT_
// PRODUCTS.md § 4) — code/name/... themselves are unchanged, now filled in
// from the underlying product, but attributes read through it (§ below).
export interface MyResource {
  id: string;
  productId: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  unitId: string;
  specification: string | null;
  manufacturer: string;
  brand: string | null;
  model: string | null;
  status: ResourceStatus;
  statusLabel: string;
  hasPrice: boolean;
  createdDate: string;
}

export interface MyResourceSearchParams {
  name?: string;
  category?: string;
  status?: ResourceStatus;
  page?: number;
  size?: number;
  sort?: string;
}

// GET /api/resources/mine/{id} — everything the read-only view dialog needs
// besides attributes, which now come from GET /api/products/{productId}/
// attributes (bax ProductAttributesReadOnly) — the old direct
// GET /api/resources/{id}/attributes endpoint was removed in the product
// split (§ 3.5).
export interface MyResourceDetail extends MyResource {
  prices: MyResourcePrice[];
}

// POST /api/resources/mine (§ 4) — two shapes depending on which path was
// taken. Yol A (productId set, existing product picked from the tree):
// only productId + listing fields matter, categoryId/name/unitId/attributes
// are omitted. Yol B (no productId): categoryId/name/unitId/attributes are
// required instead, the backend resolves/creates the product. `manufacturer`
// is mandatory on BOTH paths; `description` is never sent (server-
// generated). Prices are attached afterwards, one call per row, through
// /api/resources/mine/{id}/prices.
export interface CreateMyResourceRequest {
  productId?: string;
  categoryId?: string;
  name?: string;
  unitId?: string;
  attributes?: ProductAttributeInput[];
  specification: string;
  manufacturer: string;
  brand: string;
  model: string;
}
