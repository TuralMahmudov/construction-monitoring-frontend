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

// No `organizationId` here — for an organization caller the server derives it
// from the submitter's own organization. A central caller (no organization of
// their own, e.g. adding a price from the admin-facing Resurslar/Sənədlərin
// İdarəsi screens) must supply it explicitly or the API 400s ("Only an
// organization account can submit a price, unless the caller has
// VIEW_ALL_ORGANIZATION_RESOURCES and supplies organizationId" — verified
// live 2026-08-11). Kept out of the form itself (not user-editable, it's the
// resource's own owning org) — see createResourcePrice's separate parameter.
export interface ResourcePriceFormValues {
  regionId: string;
  price: number;
  vat: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string;
}
