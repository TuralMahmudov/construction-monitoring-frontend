import { useState } from 'react';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { DRAWER_WIDTH } from '../../layouts/constants';
import {
  canReviewDocuments,
  canUploadDocuments,
  canViewAnyReport,
  isCentralAdmin,
  isOrganizationActor,
} from '../../shared/lib/permissions';
import type { NavItem, NavSection } from '../../types/navigation';
import { navSections, organizationNavItems } from './navItems';
import { useNavBadgeCounts } from './useNavBadgeCounts';

// Pill-shaped active-item highlight, inset from the drawer edges — matches
// the reference design Tural provided (Screenshot_numune_sesda.png), not the
// previous edge-to-edge rectangle. Unchanged by the 2026-08-20 restructure.
const NAV_ITEM_SX = { borderRadius: 999, mb: 0.5 };

export interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function NavBadge({ count }: { count: number | undefined }) {
  if (!count) {
    return null;
  }
  // Neutral notification pill (bax tqms-frontend-brief.md §2.3 + Tural
  // 2026-08-20: hər üç badge — Daxil olanlar/Kənar Dəyər/Uyğunlaşdırma
  // Baxışı — eyni neytral rəngdə, qırmızı/status rəngləri işlədilmir).
  return (
    <Chip
      size="small"
      label={count > 99 ? '99+' : count}
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 600,
        bgcolor: 'action.selected',
        color: 'text.secondary',
      }}
    />
  );
}

function NavRow({
  item,
  active,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badgeCount: number | undefined;
  onNavigate: (path: string) => void;
}) {
  return (
    <ListItemButton selected={active} onClick={() => onNavigate(item.path)} sx={NAV_ITEM_SX}>
      <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
      {item.badgeKey && <NavBadge count={badgeCount} />}
    </ListItemButton>
  );
}

// Headed sections ("Bazar monitorinqi", "Sistem idarəetməsi") collapse like
// the old "Admin Panel" wrapper did (Tural 2026-08-20: statik başlıq sol
// paneli uzatdı, geri accordion-a qaytarıldı) — default open only while one
// of its own rows is the active route, otherwise closed. The badge sum
// (undefined when no child carries a badgeKey) keeps a collapsed group's
// pending counts visible without expanding it.
function SectionGroup({
  section,
  items,
  currentPath,
  badgeCounts,
  onNavigate,
}: {
  section: NavSection;
  items: NavItem[];
  currentPath: string;
  badgeCounts: Partial<Record<string, number>>;
  onNavigate: (path: string) => void;
}) {
  const isChildActive = items.some((item) => item.path === currentPath);
  const [open, setOpen] = useState(isChildActive);
  const headerBadgeTotal = items.reduce(
    (sum, item) => sum + (item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0),
    0,
  );

  return (
    <>
      <ListItemButton onClick={() => setOpen((prev) => !prev)} sx={NAV_ITEM_SX}>
        <ListItemIcon sx={{ minWidth: 40 }}>{section.icon}</ListItemIcon>
        <ListItemText primary={section.heading} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
        {headerBadgeTotal > 0 && <NavBadge count={headerBadgeTotal} />}
        {open ? (
          <ExpandLessRoundedIcon fontSize="small" sx={{ ml: 0.5 }} />
        ) : (
          <ExpandMoreRoundedIcon fontSize="small" sx={{ ml: 0.5 }} />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {items.map((item, itemIndex) => (
            <Box key={item.path}>
              {section.dividerBeforeIndex === itemIndex && <Divider sx={{ my: 1, mx: 2 }} />}
              <NavRow
                item={item}
                active={currentPath === item.path}
                badgeCount={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
                onNavigate={onNavigate}
              />
            </Box>
          ))}
        </List>
      </Collapse>
    </>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const canAccessAdmin = isCentralAdmin(user?.roles ?? []);
  const canAccessOwnResources = isOrganizationActor(user);
  const canUpload = canUploadDocuments(user);
  const canReview = canReviewDocuments(user);
  const canAccessReports = canViewAnyReport(user);
  const badgeCounts = useNavBadgeCounts({ canReviewDocuments: canReview, canAccessAdmin });

  function isItemVisible(item: NavItem): boolean {
    if (item.organizationOnly && !canAccessOwnResources) return false;
    if (item.hideForOrganization && canAccessOwnResources) return false;
    if (item.requiresDocumentUpload && !canUpload) return false;
    if (item.requiresDocumentReview && !canReview) return false;
    if (item.requiresReportsAccess && !canAccessReports) return false;
    return true;
  }

  function visibleItemsOf(section: NavSection): NavItem[] {
    if (section.centralAdminOnly && !canAccessAdmin) return [];
    return section.items.filter(isItemVisible);
  }

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <Box>
      <Toolbar sx={{ py: 2, pl: 3, bgcolor: 'rgba(20, 80, 140, 0.05)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box component="img" src={logo} alt="TQMS" sx={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block' }} />
      </Toolbar>
      <List sx={{ px: 1, py: 1 }}>
        {organizationNavItems.filter(isItemVisible).map((item) => (
          <NavRow
            key={item.path}
            item={item}
            active={location.pathname === item.path}
            badgeCount={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
            onNavigate={handleNavigate}
          />
        ))}
        {navSections.map((section, sectionIndex) => {
          const items = visibleItemsOf(section);
          if (items.length === 0) {
            return null;
          }
          if (section.heading) {
            return (
              <SectionGroup
                key={section.heading}
                section={section}
                items={items}
                currentPath={location.pathname}
                badgeCounts={badgeCounts}
                onNavigate={handleNavigate}
              />
            );
          }
          return (
            <Stack key={`section-${sectionIndex}`} component="li" sx={{ listStyle: 'none' }}>
              {items.map((item, itemIndex) => (
                <Box key={item.path}>
                  {section.dividerBeforeIndex === itemIndex && <Divider sx={{ my: 1, mx: 2 }} />}
                  <NavRow
                    item={item}
                    active={location.pathname === item.path}
                    badgeCount={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
                    onNavigate={handleNavigate}
                  />
                </Box>
              ))}
            </Stack>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            border: 'none',
          },
        }}
        open
      >
        {content}
      </Drawer>
    </Box>
  );
}
