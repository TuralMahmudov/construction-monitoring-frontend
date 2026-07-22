import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import type { NavItem } from '../../types/navigation';

export const navItems: NavItem[] = [
  {
    label: 'İdarə paneli',
    path: '/dashboard',
    icon: <HomeRoundedIcon />,
  },
  {
    label: 'Resurs Kateqoriyaları',
    path: '/resource-categories',
    icon: <AccountTreeRoundedIcon />,
  },
  {
    label: 'Resurslar',
    path: '/resources',
    icon: <Inventory2RoundedIcon />,
  },
  {
    label: 'İstinad Məlumatları',
    icon: <LibraryBooksRoundedIcon />,
    children: [
      { label: 'Vahidlər', path: '/reference-data/units', icon: <StraightenRoundedIcon /> },
      { label: 'Regionlar', path: '/reference-data/regions', icon: <PublicRoundedIcon /> },
      { label: 'Təchizatçılar', path: '/reference-data/suppliers', icon: <StorefrontRoundedIcon /> },
    ],
  },
];
