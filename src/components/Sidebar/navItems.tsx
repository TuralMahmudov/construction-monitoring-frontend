import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import PersonPinCircleRoundedIcon from '@mui/icons-material/PersonPinCircleRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SellRoundedIcon from '@mui/icons-material/SellRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { NavItem } from '../../types/navigation';

export const navItems: NavItem[] = [
  {
    label: 'İdarə paneli',
    path: '/dashboard',
    icon: <HomeRoundedIcon />,
  },
  {
    label: 'Resurs Kataloqu',
    path: '/resource-categories',
    icon: <AccountTreeRoundedIcon />,
  },
  {
    label: 'Mənim Resurslarım',
    path: '/my-resources',
    icon: <PersonPinCircleRoundedIcon />,
    organizationOnly: true,
  },
  {
    label: 'Məhsullar',
    path: '/products',
    icon: <Inventory2RoundedIcon />,
  },
  {
    label: 'Resurslar (Elanlar)',
    path: '/resources',
    icon: <SellRoundedIcon />,
  },
  {
    label: 'İstinad Məlumatları',
    icon: <LibraryBooksRoundedIcon />,
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
      { label: 'Atribut Lüğəti', path: '/admin/attribute-definitions', icon: <CategoryRoundedIcon /> },
      { label: 'Kənar Dəyər Qiymətlər', path: '/admin/flagged-prices', icon: <WarningAmberRoundedIcon /> },
      { label: 'Uyğunlaşdırma Baxışı', path: '/admin/match-groups', icon: <CompareArrowsRoundedIcon /> },
      { label: 'Bazar Qiymətləri Analitikası', path: '/admin/market-averages', icon: <QueryStatsRoundedIcon /> },
    ],
  },
];
