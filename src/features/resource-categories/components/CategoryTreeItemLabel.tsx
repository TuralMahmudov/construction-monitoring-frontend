import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusBadge } from '../../../shared/components';
import type { ResourceCategory } from '../types/resourceCategory.types';
import type { MenuAnchorPosition } from './menuAnchorPosition';

export interface CategoryTreeItemLabelProps {
  category: ResourceCategory;
  onOpenMenu: (category: ResourceCategory, position: MenuAnchorPosition) => void;
}

export function CategoryTreeItemLabel({ category, onOpenMenu }: CategoryTreeItemLabelProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', py: 0.5, width: '100%', opacity: category.active ? 1 : 0.6 }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {category.name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {category.code}
      </Typography>
      {!category.active && <StatusBadge active={false} />}
      <Box sx={{ flexGrow: 1 }} />
      <IconButton
        size="small"
        aria-label="kateqoriya menyusu"
        onClick={(event) => {
          event.stopPropagation();
          onOpenMenu(category, { top: event.clientY, left: event.clientX });
        }}
      >
        <MoreVertRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
