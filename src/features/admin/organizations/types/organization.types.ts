// FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md § 2 — "Mərkəz" is not a DB row (it's
// organizationId=NULL on users), so CENTRAL=1 is never returned by this
// endpoint in practice, only documented for completeness.
// FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 1 (2026-08-04) —
// code 2 used to mean the single generic "VENDOR" type; it now means
// MANUFACTURER specifically, alongside 3 new sibling types. Organizations
// created before this migration were bulk-reassigned to OTHER(6) server-side.
export const ORGANIZATION_TYPE = {
  CENTRAL: 1,
  MANUFACTURER: 2,
  DISTRIBUTOR: 3,
  RESELLER: 4,
  GOVERNMENT: 5,
  OTHER: 6,
} as const;

export type OrganizationType = (typeof ORGANIZATION_TYPE)[keyof typeof ORGANIZATION_TYPE];

// CENTRAL(1) is deliberately excluded from this narrower type — the
// create/edit Select must never offer it (server rejects it with 400
// "CENTRAL is not a valid organization type here"), so the form types below
// use this instead of the full OrganizationType.
export type CreatableOrganizationType = Exclude<OrganizationType, 1>;

export const ORGANIZATION_TYPE_OPTIONS: CreatableOrganizationType[] = [2, 3, 4, 5, 6];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  1: 'Mərkəzi',
  2: 'İstehsalçı',
  3: 'Satış müəssisəsi',
  4: 'Satınalıb-satan',
  5: 'Dövlət qurumu',
  6: 'Digər',
};

export const ORGANIZATION_TYPE_ICONS: Record<OrganizationType, string> = {
  1: '⭐',
  2: '🏭',
  3: '🏬',
  4: '🔁',
  5: '🏛️',
  6: '•',
};

export const ORGANIZATION_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  SUSPENDED: 3,
} as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUS)[keyof typeof ORGANIZATION_STATUS];

export const ORGANIZATION_STATUS_OPTIONS: OrganizationStatus[] = [1, 2, 3];

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
  1: 'Aktiv',
  2: 'Deaktiv',
  3: 'Bloklanıb',
};

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  taxId: string | null;
  contactInfo: string | null;
  status: OrganizationStatus;
  // Added 2026-08-04 (FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md § 7.3),
  // read-only. `undefined`/`null` for the rare row with no linked login
  // account (e.g. old placeholder organizations).
  username?: string | null;
}

// POST /api/organizations — bundles the vendor org + its single login
// account in one request (§ 2). `type` is now mandatory (must be one of
// ORGANIZATION_TYPE_OPTIONS, never CENTRAL).
export interface OrganizationCreateFormValues {
  name: string;
  type: CreatableOrganizationType;
  taxId: string;
  contactInfo: string;
  username: string;
  email: string;
  password: string;
  roleNames: string[];
}

// PUT /api/organizations/{id} — no login fields here, status is how a vendor
// is suspended/deactivated (their login account itself is untouched). The
// API accepts `type` as optional (omitted = unchanged) — the edit form
// always sends the current/edited value, which is how admins re-classify
// pre-migration orgs that were bulk-assigned OTHER(6).
export interface OrganizationUpdateFormValues {
  name: string;
  type: CreatableOrganizationType;
  taxId: string;
  contactInfo: string;
  status: OrganizationStatus;
}

export interface OrganizationSearchParams {
  name?: string;
  status?: OrganizationStatus;
  type?: OrganizationType;
  page?: number;
  size?: number;
  sort?: string;
}
