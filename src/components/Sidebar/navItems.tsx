import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { NavItem, NavSection } from '../../types/navigation';

// "İdarə paneli" (/dashboard) intentionally hidden from nav 2026-08-05 — the
// page is still a content-less placeholder (bax Dashboard.tsx), Tural wants
// it left out until there's real per-role content to put there. Route/page
// stay in the router for now, just unlinked.

// Organization-facing items (bax Sidebar.tsx-in isOrganizationActor filtri) —
// deliberately untouched by the 2026-08-20 admin-menu restructure below
// (Tural: bu iki menyuya toxunulmur), rendered as their own top-level rows,
// same as before.
export const organizationNavItems: NavItem[] = [
  {
    label: 'Mənim Resurslarım',
    path: '/my-resources',
    icon: <PersonPinCircleRoundedIcon />,
    organizationOnly: true,
    hideForOrganization: true,
  },
  {
    label: 'Sənəd İdxalı',
    path: '/documents',
    icon: <UploadFileRoundedIcon />,
    organizationOnly: true,
    requiresDocumentUpload: true,
  },
];

// 2026-08-20 restructure (tqms-frontend-brief.md) — "Admin Panel" wrapper is
// gone; its contents split by mental model into "Bazar monitorinqi" (price
// oversight/analytics) and "Sistem idarəetməsi" (access control + reference
// data), and "İstinad Məlumatları" folds into the latter instead of staying
// its own accordion. Capped at 4 sections total (2 of them headed) to keep
// the list scannable.
export const navSections: NavSection[] = [
  {
    // "Əsas" — qrupsuz, başlıqsız göstərilir.
    items: [
      { label: 'Resurs Kataloqu', path: '/resource-categories', icon: <AccountTreeRoundedIcon />, hideForOrganization: true },
      {
        label: 'Daxil olanlar',
        path: '/admin/documents',
        icon: <DownloadRoundedIcon />,
        hideForOrganization: true,
        requiresDocumentReview: true,
        badgeKey: 'pendingDocuments',
      },
      { label: 'Məhsullar', path: '/products', icon: <InventoryRoundedIcon />, hideForOrganization: true },
      { label: 'Resurslar (Elanlar)', path: '/resources', icon: <RequestQuoteRoundedIcon />, hideForOrganization: true },
    ],
  },
  {
    heading: 'Bazar monitorinqi',
    icon: <BarChartRoundedIcon />,
    centralAdminOnly: true,
    items: [
      { label: 'Bazar Qiymətləri Analitikası', path: '/admin/market-averages', icon: <QueryStatsRoundedIcon /> },
      {
        label: 'Kənar Dəyər Qiymətlər',
        path: '/admin/flagged-prices',
        icon: <WarningAmberRoundedIcon />,
        badgeKey: 'flaggedPrices',
      },
    ],
  },
  {
    heading: 'Sistem idarəetməsi',
    icon: <AdminPanelSettingsRoundedIcon />,
    centralAdminOnly: true,
    // items[2] (Vahidlər) ilə items[1] (İstifadəçilər) arasında statik
    // divider — giriş/icazə idarəetməsini (Təşkilatlar/İstifadəçilər)
    // istinad/lookup datasından (Vahidlər/Regionlar/Xüsusiyyət Növləri)
    // vizual ayırır, əlavə accordion açmadan.
    dividerBeforeIndex: 2,
    items: [
      { label: 'Təşkilatlar', path: '/admin/organizations', icon: <ApartmentRoundedIcon /> },
      { label: 'İstifadəçilər', path: '/admin/users', icon: <GroupRoundedIcon /> },
      { label: 'Vahidlər', path: '/reference-data/units', icon: <StraightenRoundedIcon /> },
      { label: 'Regionlar', path: '/reference-data/regions', icon: <PublicRoundedIcon /> },
      { label: 'Xüsusiyyət Növləri', path: '/admin/attribute-definitions', icon: <CategoryRoundedIcon /> },
    ],
  },
  {
    // "Hesabatlar" — qrupsuz, başlıqsız, ən aşağıda (FRONTEND_AI_PROMPT_REPORTS.md).
    // hideForOrganization, 2026-08-31 (Tural) — canViewAnyReport bir COST_READ
    // holder-i buraxır, vendor rollarında bu icazə ola bilər, amma bütün 3
    // hesabat da mərkəzi/cross-org məzmundur (bax ReportsListPage-in REPORTS
    // massivi) — vendor bu menyunu heç görməməlidir, "Bazar monitorinqi"
    // bölməsi kimi (centralAdminOnly).
    items: [
      {
        label: 'Hesabatlar',
        path: '/reports',
        icon: <SummarizeRoundedIcon />,
        requiresReportsAccess: true,
        hideForOrganization: true,
      },
    ],
  },
];
