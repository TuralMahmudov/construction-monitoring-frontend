import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DriveFileMoveRoundedIcon from '@mui/icons-material/DriveFileMoveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { ResourceCategory } from '../types/resourceCategory.types';
import type { MenuAnchorPosition } from './menuAnchorPosition';

export interface CategoryContextMenuProps {
  category: ResourceCategory | null;
  position: MenuAnchorPosition | null;
  onClose: () => void;
  onAddChild: (category: ResourceCategory) => void;
  onEdit: (category: ResourceCategory) => void;
  onMove: (category: ResourceCategory) => void;
  onToggleActive: (category: ResourceCategory) => void;
  onDelete: (category: ResourceCategory) => void;
}

export function CategoryContextMenu({
  category,
  position,
  onClose,
  onAddChild,
  onEdit,
  onMove,
  onToggleActive,
  onDelete,
}: CategoryContextMenuProps) {
  const open = Boolean(category) && Boolean(position);

  function runAction(action: (category: ResourceCategory) => void) {
    if (category) {
      action(category);
    }
    onClose();
  }

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ?? undefined}
    >
      <MenuItem onClick={() => runAction(onAddChild)}>
        <ListItemIcon>
          <AddRoundedIcon fontSize="small" />
        </ListItemIcon>
        Alt kateqoriya əlavə et
      </MenuItem>
      <MenuItem onClick={() => runAction(onEdit)}>
        <ListItemIcon>
          <EditRoundedIcon fontSize="small" />
        </ListItemIcon>
        Redaktə et
      </MenuItem>
      <MenuItem onClick={() => runAction(onMove)}>
        <ListItemIcon>
          <DriveFileMoveRoundedIcon fontSize="small" />
        </ListItemIcon>
        Köçür
      </MenuItem>
      <MenuItem onClick={() => runAction(onToggleActive)}>
        <ListItemIcon>
          {category?.active ? (
            <BlockRoundedIcon fontSize="small" />
          ) : (
            <CheckCircleRoundedIcon fontSize="small" />
          )}
        </ListItemIcon>
        {category?.active ? 'Deaktiv et' : 'Aktivləşdir'}
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => runAction(onDelete)} sx={{ color: 'error.main' }}>
        <ListItemIcon>
          <DeleteRoundedIcon fontSize="small" color="error" />
        </ListItemIcon>
        Sil
      </MenuItem>
    </Menu>
  );
}
