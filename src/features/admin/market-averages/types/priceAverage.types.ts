// `resourceName` — the product's own name (bax FRONTEND_AI_PROMPT_PRODUCTS.md
// § 8: query param and field renamed matchGroupId → productId). As of
// 2026-07-31, manufacturer/brand/model are REMOVED from this response —
// this averages (productId, regionId) across potentially several orgs, each
// with its own brand, so no single manufacturer/brand/model correctly
// describes the group. Per-listing brand data lives on
// GET /api/resources?product={productId} instead (bax
// ProductListingsTab). `avgPrice` intentionally dropped from display
// everywhere in this feature — median is the only central-tendency figure
// shown (user decision).
export interface ResourcePriceAverageResponse {
  productId: string;
  categoryId: string;
  resourceName: string;
  regionId: string;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  calculatedAt: string;
}

export interface PriceAverageSearchParams {
  productId?: string;
  regionId?: string;
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
}
