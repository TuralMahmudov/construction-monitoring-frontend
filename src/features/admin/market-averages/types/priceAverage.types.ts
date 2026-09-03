// `resourceName` — the product's own name (bax FRONTEND_AI_PROMPT_PRODUCTS.md
// § 8: query param and field renamed matchGroupId → productId). As of
// 2026-07-31, manufacturer/model are REMOVED from this response — this
// averages (productId, regionId) across potentially several orgs, each with
// its own manufacturer, so no single manufacturer/model correctly describes
// the group. Per-listing manufacturer/model data lives on
// GET /api/resources?product={productId} instead (bax ProductListingsTab).
// `brand`, unlike manufacturer/model, DOES still describe the group — since
// FRONTEND_AI_PROMPT_BRAND_IDENTITY.md it's baked into productId itself
// (different brand = different product/row), so it never needed its own
// column here; it shows up indirectly via `resourceName`/product code.
// `avgPrice` intentionally dropped from display everywhere in this feature —
// median is the only central-tendency figure shown (user decision).
export interface ResourcePriceAverageResponse {
  productId: string;
  categoryId: string;
  resourceName: string;
  // Added 2026-08-19 (FRONTEND_AI_PROMPT_REPORTS_LIVE_AND_DOCUMENTS.md § 1) —
  // names alongside the ids that were already here, no separate lookup needed.
  productCode: string;
  categoryName: string;
  unitName: string;
  regionId: string;
  regionName: string;
  // Added 2026-08-20 (BACKEND_REQUEST_MARKET_AVERAGES_VAT_AND_VARIABILITY_FILTER.md
  // § 1) — display-only MIN() column, not part of the group-by (backend
  // confirmed `price` is always net-of-VAT already, so no normalization was
  // needed; real data is AZN-only today, this just guards the assumption).
  currency: string;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  // sampleCount = neçə TƏŞKİLAT (bir təşkilatın neçə resursu olsa da 1 səs);
  // resourceCount = neçə RESURS (xam təklif sayı) — bax FRONTEND_AI_PROMPT_ADMIN_PANEL.md § 6, 2026-08-14.
  sampleCount: number;
  resourceCount: number;
  calculatedAt: string;
}

export type VariabilityLevelParam = 'STABLE' | 'MODERATE' | 'HIGH';

export interface PriceAverageSearchParams {
  productId?: string;
  categoryId?: string;
  regionId?: string;
  name?: string;
  // Added 2026-08-20 (BACKEND_REQUEST_MARKET_AVERAGES_VAT_AND_VARIABILITY_FILTER.md
  // § 2) — DB-level filter, does not break pagination (unlike the old
  // frontend-only computeVariability, which only ever saw the current page).
  variabilityLevel?: VariabilityLevelParam;
  page?: number;
  size?: number;
  sort?: string;
}

// GET /api/resource-prices/averages/stats — same filters as above minus
// variabilityLevel, full-result counts regardless of pagination.
export interface ResourcePriceAverageSummaryResponse {
  stableCount: number;
  moderateCount: number;
  highCount: number;
}
