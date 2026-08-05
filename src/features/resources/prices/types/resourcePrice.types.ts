export const PRICE_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  FLAGGED: 4,
} as const;

export type PriceStatus = 1 | 2 | 3 | 4;

export const PRICE_STATUS_LABELS: Record<PriceStatus, string> = {
  1: 'Gözləmədə',
  2: 'Təsdiqlənib',
  3: 'Rədd edilib',
  4: 'Kənar dəyər',
};

export interface ResourcePrice {
  id: string;
  resourceId: string;
  regionId: string;
  organizationId: string;
  // Added 2026-08-04 (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 7.2)
  // — denormalized so any role can display it without an ORGANIZATION_READ-gated lookup.
  organizationName: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string | null;
  status: PriceStatus;
  createdBy: string;
  createdDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
}

// No `organizationId` here — FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md
// § 3: the server always derives it from the submitting user's own
// organization, the field was removed from the API entirely (not just
// auto-filled client-side).
export interface ResourcePriceFormValues {
  regionId: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string;
}
