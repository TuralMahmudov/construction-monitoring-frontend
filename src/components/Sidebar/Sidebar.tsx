import { useState } from 'react';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { DRAWER_WIDTH } from '../../layouts/constants';
import { isCentralAdmin, isOrganizationActor } from '../../shared/lib/permissions';
import type { NavItem } from '../../types/navigation';
import { navItems } from './navItems';

// Pill-shaped active-item highlight, inset from the drawer edges — matches
// the reference design Tural provided (Screenshot_numune_sesda.png), not the
// previous edge-to-edge rectangle.
const NAV_ITEM_SX = { borderRadius: 999, mb: 0.5 };


export interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function NavItemGroup({
  item,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  const isChildActive = item.children?.some((child) => child.path === currentPath) ?? false;
  const [open, setOpen] = useState(isChildActive);

  if (!item.children) {
    return (
      <ListItemButton
        selected={currentPath === item.path}
        onClick={() => item.path && onNavigate(item.path)}
        sx={NAV_ITEM_SX}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItemButton>
    );
  }

  return (
    <>
      <ListItemButton onClick={() => setOpen((prev) => !prev)} sx={NAV_ITEM_SX}>
        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
        {open ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {item.children.map((child) => (
            <ListItemButton
              key={child.path}
              selected={currentPath === child.path}
              onClick={() => child.path && onNavigate(child.path)}
              sx={NAV_ITEM_SX}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
              <ListItemText primary={child.label} />
            </ListItemButton>
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
  const visibleNavItems = navItems.filter((item) => {
    if (item.centralAdminOnly && !canAccessAdmin) {
      return false;
    }
    if (item.organizationOnly && !canAccessOwnResources) {
      return false;
    }
    if (item.hideForOrganization && canAccessOwnResources) {
      return false;
    }
    return true;
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <Box>
      <Toolbar sx={{ py: 2 }}>
        <Box component="img" src={logo} alt="TQMS" sx={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block' }} />
      </Toolbar>
      <List sx={{ px: 1, py: 1 }}>
        {visibleNavItems.map((item) => (
          <NavItemGroup
            key={item.label}
            item={item}
            currentPath={location.pathname}
            onNavigate={handleNavigate}
          />
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
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
