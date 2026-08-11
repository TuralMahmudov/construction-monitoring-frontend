import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { StatusBadge } from '../../../shared/components';
import type { ResourceCategory } from '../types/resourceCategory.types';

export interface CategoryTreeItemLabelProps {
  category: ResourceCategory;
}

export function CategoryTreeItemLabel({ category }: CategoryTreeItemLabelProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', py: 0.5, width: '100%', minWidth: 0, opacity: category.active ? 1 : 0.6 }}
    >
      <FolderRoundedIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
      <Tooltip title={category.name}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500, minWidth: 0 }}>
          {category.name}
        </Typography>
      </Tooltip>
      {!category.active && <StatusBadge active={false} />}
    </Stack>
  );
}
