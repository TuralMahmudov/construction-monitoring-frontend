import type { AttributeDataType } from '../../admin/attribute-definitions/types/attributeDefinition.types';

// Confirmed shape (FRONTEND_AI_PROMPT_PRODUCTS.md § 0/§ 2) — product now owns
// the catalog identity (code/name/attributes/unit) that used to live directly
// on `resource`. `reviewStatus` mirrors the old match-group confirmation flow:
// 1 = confirmed, 2 = pending review (attributes list was empty on creation).
export const PRODUCT_REVIEW_STATUS = {
  CONFIRMED: 1,
  PENDING_REVIEW: 2,
} as const;

export type ProductReviewStatus = (typeof PRODUCT_REVIEW_STATUS)[keyof typeof PRODUCT_REVIEW_STATUS];

export interface Product {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  // Server-generated (category name + "attributeName: value, ..."), not
  // client-editable — see FRONTEND_AI_PROMPT_PRODUCTS.md § 2.
  description: string | null;
  unitId: string | null;
  reviewStatus: ProductReviewStatus;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

// GET /api/products/{id}/attributes row (§ 2.1) — same joined shape the old
// ResourceAttribute had, just re-parented under productId.
export interface ProductAttribute {
  id: string;
  productId: string;
  categoryAttributeDefinitionId: string;
  attributeDefinitionId: string;
  attributeName: string;
  dataType: AttributeDataType;
  value: string;
  unitCode: string | null;
  unitSymbol: string | null;
  sortOrder: number;
  searchable: boolean;
  required: boolean;
  affectsMatchGroup: boolean;
  active: boolean;
}

export interface ProductAttributeInput {
  categoryAttributeDefinitionId: string;
  value: string;
}

// POST /api/products body (§ 2) — find-or-create. name/unitId are only
// honored when a new product actually gets created; an existing match
// silently ignores them. No description (server-generated) and no
// specification/manufacturer/brand/model (those go to POST /api/resources).
export interface ProductCreateRequest {
  categoryId: string;
  name: string;
  unitId: string | null;
  attributes: ProductAttributeInput[];
}

// PUT /api/products/{id} (§ 2.2) — cosmetic fields only, categoryId/
// attributes/unitId/code/description are immutable after creation.
export interface ProductUpdateRequest {
  name: string;
  active: boolean;
}

export interface ProductFindOrCreateResponse {
  matched: boolean;
  product: Product;
}

export interface ProductSearchParams {
  category?: string;
  name?: string;
  code?: string;
  unit?: string;
  active?: boolean;
  attributeName?: string;
  attributeValue?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// GET /api/products/pending-review row (§ 7) — the old MatchGroupReview
// `resources[]` (code+name per row) became `listings[]` (id+organizationId
// only), since the product itself now carries code/name once at the top.
export interface ProductReviewListing {
  id: string;
  organizationId: string | null;
}

export interface ProductReviewResponse {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  matchKey: string;
  createdDate: string;
  reviewStatus: ProductReviewStatus;
  listings: ProductReviewListing[];
}

export interface ProductReviewSearchParams {
  page?: number;
  size?: number;
  sort?: string;
}
