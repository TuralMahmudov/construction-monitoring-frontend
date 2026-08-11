import { useState } from 'react';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification.types';

const PAGE_SIZE = 10;

export function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Always enabled (not just while the menu is open) so the badge count on
  // the closed bell icon stays live via the 30s poll — gating this component
  // to DOCUMENT_REVIEW holders only happens one level up, in Header.
  const notificationsQuery = useNotifications({ page: 0, size: PAGE_SIZE }, true);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const items = notificationsQuery.data?.content ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  function handleItemClick(notification: AppNotification) {
    setAnchorEl(null);
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.referenceType === 'DOCUMENT') {
      navigate('/admin/documents');
    }
  }

  return (
    <>
      <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)} aria-label="bildirişlər">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsRoundedIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)} slotProps={{ paper: { sx: { width: 380 } } }}>
        <Stack direction="row" sx={{ px: 2, py: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Bildirişlər
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => markAllReadMutation.mutate()}>
              Hamısını oxu
            </Button>
          )}
        </Stack>
        <Divider />
        {items.length === 0 && (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Bildiriş yoxdur.
            </Typography>
          </Box>
        )}
        <List sx={{ maxHeight: 400, overflowY: 'auto', py: 0 }}>
          {items.map((notification) => (
            <ListItemButton key={notification.id} onClick={() => handleItemClick(notification)} sx={{ alignItems: 'flex-start' }}>
              <ListItemText
                primary={notification.message}
                secondary={dayjs(notification.createdAt).format('DD.MM.YYYY HH:mm')}
                slotProps={{
                  primary: { sx: { fontWeight: notification.isRead ? 400 : 700, whiteSpace: 'normal' } },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Menu>
    </>
  );
}
