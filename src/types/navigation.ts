import type { ReactNode } from 'react';

export interface NavItem {
  label: string;
  path?: string;
  icon: ReactNode;
  children?: NavItem[];
  centralAdminOnly?: boolean;
  organizationOnly?: boolean;
  // Hidden for vendor/organization accounts (isOrganizationActor) — visible to
  // ALL central staff regardless of role, not just SUPER_ADMIN/ADMIN. Broader
  // than centralAdminOnly, which only covers the admin-role subset.
  hideForOrganization?: boolean;
  // Sənəd İdxalı module (bax shared/lib/permissions.ts) — permission-array
  // gates, independent of the role-based flags above.
  requiresDocumentUpload?: boolean;
  requiresDocumentReview?: boolean;
}
