import { TreeItem } from '@mui/x-tree-view/TreeItem';
import Typography from '@mui/material/Typography';
import type { ResourceCategoryTreeNode } from '../types/resourceCategory.types';

export interface CategoryFilterTreeItemProps {
  category: ResourceCategoryTreeNode;
  selectedId: string | null;
  onSelect: (category: ResourceCategoryTreeNode) => void;
}

// Same convention as PickerCategoryTreeItem (bağlıdır Mənim Resurslarım-ın
// kateqoriya/məhsul seçicisinə) — leaf-lər seçilə bilər (bold, kliklənir),
// ara/kök kateqoriyalar sırf naviqasiyadır (normal çəki, yalnız expand-arrow
// işləyir). Products filtri üçün sadələşdirilmiş versiya — leaf-in altında
// məhsul siyahısı göstərmir, çünki bura filter üçün kateqoriya seçən yerdir.
export function CategoryFilterTreeItem({ category, selectedId, onSelect }: CategoryFilterTreeItemProps) {
  const isSelected = category.id === selectedId;

  return (
    <TreeItem
      itemId={category.id}
      label={
        <Typography
          variant="body2"
          sx={{
            py: 0.5,
            fontWeight: category.leaf ? 600 : 500,
            color: isSelected ? 'primary.main' : undefined,
            cursor: category.leaf ? 'pointer' : 'default',
            '&:hover': category.leaf ? { color: 'primary.main' } : undefined,
          }}
          onClick={
            category.leaf
              ? (event) => {
                  event.stopPropagation();
                  onSelect(category);
                }
              : undefined
          }
        >
          {category.name}
        </Typography>
      }
    >
      {(category.children ?? []).map((child) => (
        <CategoryFilterTreeItem key={child.id} category={child} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </TreeItem>
  );
}
