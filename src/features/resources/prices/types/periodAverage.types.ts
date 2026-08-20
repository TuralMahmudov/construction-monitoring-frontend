// GET /api/resource-prices/period-averages (FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md
// § 3) — historical/trend sibling of the live /averages endpoint. Does NOT
// consult `superseded` (deliberate, so historical figures never move
// retroactively) — a resource superseded within the same quarter as its
// replacement still contributes to that quarter's average (documented
// backend limitation, not a bug).
export interface ResourcePricePeriodAverageResponse {
  productId: string;
  categoryId: string;
  resourceName: string;
  // Added 2026-08-18 (FRONTEND_AI_PROMPT_REPORTS.md § 2.2) — names alongside
  // the ids that were already here, no separate lookup needed anymore.
  productCode: string;
  categoryName: string;
  unitName: string;
  regionId: string;
  regionName: string;
  periodYear: number;
  periodQuarter: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleCount: number;
  resourceCount: number;
  // Nearest previous quarter WITH data (not necessarily the immediately
  // preceding calendar quarter) — null when there's no earlier data at all.
  previousAvgPrice: number | null;
  previousMedianPrice: number | null;
  // Signed percent change vs previousAvgPrice; null whenever that's null or 0.
  periodOverPeriodChangePct: number | null;
  calculatedAt: string;
}

export interface PeriodAverageSearchParams {
  productId?: string;
  // Added 2026-08-18 (FRONTEND_AI_PROMPT_REPORTS.md § 2.1).
  categoryId?: string;
  regionId?: string;
  periodYear?: number;
  periodQuarter?: number;
  name?: string;
  page?: number;
  size?: number;
  sort?: string;
}
