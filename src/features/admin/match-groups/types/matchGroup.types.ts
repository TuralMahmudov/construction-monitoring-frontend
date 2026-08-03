// FRONTEND_AI_PROMPT_PRODUCTS.md § 7 — this used to be resource-match-groups
// (each row held raw `resources[]` with their own code/name). Now a
// low-confidence group IS a pending-review product: the code/name live once
// at the top, and `listings` only carries id/organizationId per listing
// (no per-row code/name, the product's own code/name covers that).
export interface MatchGroupReviewListing {
  id: string;
  organizationId: string | null;
}

export interface MatchGroupReviewResponse {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  matchKey: string;
  createdDate: string;
  reviewStatus: number;
  listings: MatchGroupReviewListing[];
}

export interface MatchGroupSearchParams {
  page?: number;
  size?: number;
  sort?: string;
}
