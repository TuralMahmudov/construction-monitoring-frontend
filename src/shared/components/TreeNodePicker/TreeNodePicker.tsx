import { useCallback, type SyntheticEvent } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

export interface TreeNodePickerNode {
  id: string;
  label: string;
  secondaryLabel?: string;
  disabled?: boolean;
  hasChildren: boolean;
  /** undefined = not fetched yet (shows a lazy-load placeholder on expand) */
  children?: TreeNodePickerNode[];
}

const NULL_NODE_ID = '__none__';

export interface TreeNodePickerProps {
  roots: TreeNodePickerNode[];
  value: string | null;
  onChange: (id: string | null) => void;
  expandedIds: string[];
  onExpandedIdsChange: (ids: string[]) => void;
  onLoadChildren: (nodeId: string) => void;
  loadingNodeIds?: string[];
  allowNull?: boolean;
  nullLabel?: string;
  emptyLabel?: string;
}

/**
 * Generic single-select hierarchical picker, data-agnostic: the caller
 * supplies the (possibly partially-loaded) node tree and reacts to
 * expansion by fetching that node's children — this component only renders
 * and reports interaction, so it can be reused by any future module with a
 * tree-shaped picker (Units, Resources, ...), not just categories.
 */
export function TreeNodePicker({
  roots,
  value,
  onChange,
  expandedIds,
  onExpandedIdsChange,
  onLoadChildren,
  loadingNodeIds = [],
  allowNull = true,
  nullLabel = 'Kök kateqoriya (valideyn yoxdur)',
  emptyLabel = 'Heç bir kateqoriya tapılmadı.',
}: TreeNodePickerProps) {
  const handleExpandedItemsChange = useCallback(
    (_event: SyntheticEvent | null, itemIds: string[]) => {
      const newlyExpanded = itemIds.filter((id) => !expandedIds.includes(id));
      onExpandedIdsChange(itemIds);
      newlyExpanded.forEach((id) => onLoadChildren(id));
    },
    [expandedIds, onExpandedIdsChange, onLoadChildren],
  );

  const handleSelectedItemsChange = useCallback(
    (_event: SyntheticEvent | null, itemId: string | null) => {
      onChange(itemId === NULL_NODE_ID ? null : itemId);
    },
    [onChange],
  );

  function renderNode(node: TreeNodePickerNode) {
    const isLoading = loadingNodeIds.includes(node.id);
    const isPlaceholderNeeded = node.hasChildren && node.children === undefined;

    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
        disabled={node.disabled}
        label={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.25 }}>
            <Radio size="small" checked={value === node.id} disabled={node.disabled} sx={{ p: 0.25 }} />
            <Typography variant="body2">{node.label}</Typography>
            {node.secondaryLabel && (
              <Typography variant="caption" color="text.secondary">
                {node.secondaryLabel}
              </Typography>
            )}
            {isLoading && <CircularProgress size={14} />}
          </Stack>
        }
      >
        {node.hasChildren &&
          (isPlaceholderNeeded ? (
            // Forces the expand affordance to render before the real
            // children arrive from the lazy-load fetch triggered on expand.
            <TreeItem itemId={`${node.id}__placeholder`} label="" disabled />
          ) : (
            node.children?.map((child) => renderNode(child))
          ))}
      </TreeItem>
    );
  }

  if (roots.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 320,
        overflowY: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 1,
      }}
    >
      <SimpleTreeView
        expandedItems={expandedIds}
        onExpandedItemsChange={handleExpandedItemsChange}
        selectedItems={value ?? (allowNull ? NULL_NODE_ID : null)}
        onSelectedItemsChange={handleSelectedItemsChange}
      >
        {allowNull && (
          <TreeItem
            itemId={NULL_NODE_ID}
            label={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.25 }}>
                <Radio size="small" checked={value === null} sx={{ p: 0.25 }} />
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {nullLabel}
                </Typography>
              </Stack>
            }
          />
        )}
        {roots.map((node) => renderNode(node))}
      </SimpleTreeView>
    </Box>
  );
}
