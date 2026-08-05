export interface FlaggedPriceReviewResponse {
  id: string;
  resourceId: string;
  regionId: string;
  organizationId: string;
  // Added 2026-08-04 (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 7.2, bonus)
  organizationName: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  status: 4;
  createdBy: string;
  createdDate: string;
  currentMedianPrice: number | null;
  deviationPercent: number | null;
  sampleCount: number;
}

export interface FlaggedPriceSearchParams {
  page?: number;
  size?: number;
  sort?: string;
}
