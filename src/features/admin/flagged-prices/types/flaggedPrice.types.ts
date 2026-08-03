export interface FlaggedPriceReviewResponse {
  id: string;
  resourceId: string;
  regionId: string;
  supplierId: string;
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
