export const PRICE_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;

export type PriceStatus = 1 | 2 | 3;

export const PRICE_STATUS_LABELS: Record<PriceStatus, string> = {
  1: 'Gözləmədə',
  2: 'Təsdiqlənib',
  3: 'Rədd edilib',
};

export interface ResourcePrice {
  id: string;
  resourceId: string;
  regionId: string;
  supplierId: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  status: PriceStatus;
  createdBy: string;
  createdDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
}

export interface ResourcePriceFormValues {
  regionId: string;
  supplierId: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
}
