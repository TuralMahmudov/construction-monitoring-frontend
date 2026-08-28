// GET /api/reports/submitted-prices (FRONTEND_AI_PROMPT_SUBMITTED_PRICES.md) —
// periodYear/periodQuarter are mandatory (bounds the export size, unlike the
// other reports where they're optional); the rest narrow further.
export interface SubmittedPricesReportParams {
  periodYear: number;
  periodQuarter: number;
  organizationId?: string;
  productId?: string;
  categoryId?: string;
  regionId?: string;
  status?: number;
}
