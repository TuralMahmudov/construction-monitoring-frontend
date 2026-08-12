import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SellRoundedIcon from '@mui/icons-material/SellRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { NavItem } from '../../types/navigation';

// "İdarə paneli" (/dashboard) intentionally hidden from nav 2026-08-05 — the
// page is still a content-less placeholder (bax Dashboard.tsx), Tural wants
// it left out until there's real per-role content to put there. Route/page
// stay in the router for now, just unlinked.
export const navItems: NavItem[] = [
  {
    label: 'Resurs Kataloqu',
    path: '/resource-categories',
    icon: <AccountTreeRoundedIcon />,
    // 2026-08-11 (Tural) — təşkilat hesabları üçün naviqasiyada yalnız
    // "Sənəd İdxalı" qalsın, qalanı gizlədilsin. Route qalır, sadəcə linksiz.
    hideForOrganization: true,
  },
  {
    label: 'Mənim Resurslarım',
    path: '/my-resources',
    icon: <PersonPinCircleRoundedIcon />,
    organizationOnly: true,
    // 2026-08-11 (Tural) — eyni qərar: təşkilat hesabları üçün naviqasiyada
    // gizlədilir (bu item onsuz da yalnız təşkilat üçün idi, ona görə hər iki
    // bayraqla nəticədə heç kimə göstərilmir). Route qalır, sadəcə linksiz.
    hideForOrganization: true,
  },
  {
    label: 'Sənəd İdxalı',
    path: '/documents',
    icon: <UploadFileRoundedIcon />,
    organizationOnly: true,
    requiresDocumentUpload: true,
  },
  {
    label: 'Daxil olanlar',
    path: '/admin/documents',
    icon: <DownloadRoundedIcon />,
    hideForOrganization: true,
    requiresDocumentReview: true,
  },
  {
    label: 'Məhsullar',
    path: '/products',
    icon: <Inventory2RoundedIcon />,
    hideForOrganization: true,
  },
  {
    label: 'Resurslar (Elanlar)',
    path: '/resources',
    icon: <SellRoundedIcon />,
    hideForOrganization: true,
  },
  {
    label: 'İstinad Məlumatları',
    icon: <LibraryBooksRoundedIcon />,
    hideForOrganization: true,
    children: [
      { label: 'Vahidlər', path: '/reference-data/units', icon: <StraightenRoundedIcon /> },
      { label: 'Regionlar', path: '/reference-data/regions', icon: <PublicRoundedIcon /> },
    ],
  },
  {
    label: 'Admin Panel',
    icon: <AdminPanelSettingsRoundedIcon />,
    centralAdminOnly: true,
    children: [
      { label: 'Təşkilatlar', path: '/admin/organizations', icon: <ApartmentRoundedIcon /> },
      { label: 'İstifadəçilər', path: '/admin/users', icon: <GroupRoundedIcon /> },
      { label: 'Xüsusiyyət Növləri', path: '/admin/attribute-definitions', icon: <CategoryRoundedIcon /> },
      { label: 'Kənar Dəyər Qiymətlər', path: '/admin/flagged-prices', icon: <WarningAmberRoundedIcon /> },
      { label: 'Uyğunlaşdırma Baxışı', path: '/admin/match-groups', icon: <CompareArrowsRoundedIcon /> },
      { label: 'Bazar Qiymətləri Analitikası', path: '/admin/market-averages', icon: <QueryStatsRoundedIcon /> },
    ],
  },
];
