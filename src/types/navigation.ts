import type { ReactNode } from 'react';

// Which live count (bax useNavBadgeCounts) a nav item's badge should show —
// keeps navItems.tsx declarative (no fetching logic in the data file itself).
export type NavBadgeKey = 'pendingDocuments' | 'flaggedPrices' | 'pendingMatchGroups';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  organizationOnly?: boolean;
  // Hidden for vendor/organization accounts (isOrganizationActor) — visible to
  // ALL central staff regardless of role, not just SUPER_ADMIN/ADMIN. Broader
  // than a section's centralAdminOnly, which only covers the admin-role subset.
  hideForOrganization?: boolean;
  // Sənəd İdxalı module (bax shared/lib/permissions.ts) — permission-array
  // gates, independent of the role-based flags above.
  requiresDocumentUpload?: boolean;
  requiresDocumentReview?: boolean;
  // Hesabatlar module (bax shared/lib/permissions.ts canViewAnyReport) — hər
  // hesabatın öz gate-i ReportsListPage-də ayrıca yoxlanılır, bu sadəcə "ən
  // azı bir hesabata girişi var" ümumi qapısıdır.
  requiresReportsAccess?: boolean;
  badgeKey?: NavBadgeKey;
}

export interface NavSection {
  // Omitted for the top/bottom ungrouped rows ("Əsas", "Hesabatlar") — no
  // header row is rendered for those, items sit flush with the list.
  heading?: string;
  // Required alongside heading — the accordion header row renders like any
  // other nav row (icon + normal-size label), not a small caption, so it
  // needs its own icon the same way a leaf NavItem does.
  icon?: ReactNode;
  // Whole section gated the same way the old "Admin Panel" wrapper node was
  // (bax Sidebar.tsx) — replaces per-item repetition of the same flag.
  centralAdminOnly?: boolean;
  items: NavItem[];
  // Renders a thin, non-interactive divider immediately before items[index]
  // — e.g. "Sistem idarəetməsi" separates access-control rows (Təşkilatlar/
  // İstifadəçilər) from reference/lookup rows (Vahidlər/Regionlar/Xüsusiyyət
  // Növləri) this way, without a second heading or an accordion.
  dividerBeforeIndex?: number;
}
