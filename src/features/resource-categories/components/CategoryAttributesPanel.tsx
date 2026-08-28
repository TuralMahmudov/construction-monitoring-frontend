import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ATTRIBUTE_DATA_TYPE_LABELS } from '../../admin/attribute-definitions/types/attributeDefinition.types';
import { useAllActiveAttributeDefinitions } from '../../admin/attribute-definitions/hooks/useAttributeDefinitions';
import { LinkAttributeDialog } from './LinkAttributeDialog';
import {
  useCategoryAttributes,
  useLinkAttributeToCategory,
  useUnlinkCategoryAttributeDefinition,
  useUpdateCategoryAttributeDefinition,
} from '../hooks/useCategoryAttributeDefinitions';
import type {
  CategoryAttributeDefinition,
  LinkAttributeToCategoryFormValues,
  UpdateCategoryAttributeDefinitionFormValues,
} from '../types/categoryAttributeDefinition.types';

export interface CategoryAttributesPanelProps {
  categoryId: string;
  canEdit: boolean;
}

export function CategoryAttributesPanel({ categoryId, canEdit }: CategoryAttributesPanelProps) {
  const attributesQuery = useCategoryAttributes(categoryId);
  const allDefinitionsQuery = useAllActiveAttributeDefinitions();
  const linkMutation = useLinkAttributeToCategory(categoryId);
  const updateMutation = useUpdateCategoryAttributeDefinition(categoryId);
  const unlinkMutation = useUnlinkCategoryAttributeDefinition(categoryId);
  const isSubmitting = linkMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    item: CategoryAttributeDefinition | null;
  }>({ open: false, mode: 'create', item: null });
  const [unlinkTarget, setUnlinkTarget] = useState<CategoryAttributeDefinition | null>(null);

  function closeDialog() {
    setDialog({ open: false, mode: 'create', item: null });
  }

  function handleSubmit(
    values: LinkAttributeToCategoryFormValues | UpdateCategoryAttributeDefinitionFormValues,
    onError: (error: unknown) => void,
  ) {
    if (dialog.mode === 'edit' && dialog.item) {
      updateMutation.mutate(
        { id: dialog.item.id, payload: values as UpdateCategoryAttributeDefinitionFormValues },
        { onSuccess: closeDialog, onError },
      );
    } else {
      linkMutation.mutate(values as LinkAttributeToCategoryFormValues, { onSuccess: closeDialog, onError });
    }
  }

  if (attributesQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (attributesQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(attributesQuery.error)}</Alert>;
  }

  const links = attributesQuery.data ?? [];
  const linkedDefinitionIds = new Set(links.map((link) => link.attributeDefinitionId));
  const availableDefinitions = (allDefinitionsQuery.data?.content ?? []).filter(
    (definition) => !linkedDefinitionIds.has(definition.id),
  );

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">Bağlı xüsusiyyət növləri</Typography>
        {canEdit && (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialog({ open: true, mode: 'create', item: null })}
          >
            Xüsusiyyət növü bağla
          </Button>
        )}
      </Stack>

      {links.length === 0 ? (
        <Alert severity="warning" sx={{ my: 1 }}>
          Bu kateqoriyaya hələ heç bir xüsusiyyət növü bağlanmayıb — bu kateqoriyada yeni məhsul yaradıla bilməz.
          İstifadəyə açmaq üçün ən azı bir xüsusiyyət növü bağlayın.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ad</TableCell>
                <TableCell>Tip</TableCell>
                {canEdit && <TableCell align="right">Əməliyyatlar</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} hover>
                  <TableCell>{link.attributeName}</TableCell>
                  <TableCell>{ATTRIBUTE_DATA_TYPE_LABELS[link.dataType]}</TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label="konfiqurasiya et"
                        onClick={() => setDialog({ open: true, mode: 'edit', item: link })}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="ayır"
                        onClick={() => setUnlinkTarget(link)}
                      >
                        <LinkOffRoundedIcon fontSize="small" color="error" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {canEdit && (
        <>
          <LinkAttributeDialog
            open={dialog.open}
            mode={dialog.mode}
            editValues={
              dialog.item
                ? {
                    attributeDefinitionId: dialog.item.attributeDefinitionId,
                    required: dialog.item.required,
                    visible: dialog.item.visible,
                    searchable: dialog.item.searchable,
                    filterable: dialog.item.filterable,
                    sortOrder: dialog.item.sortOrder,
                    affectsMatchGroup: dialog.item.affectsMatchGroup,
                  }
                : null
            }
            editAttributeName={dialog.item?.attributeName}
            availableDefinitions={availableDefinitions}
            nextSortOrder={links.length}
            isSubmitting={isSubmitting}
            onClose={closeDialog}
            onSubmit={handleSubmit}
          />

          <ConfirmDialog
            open={Boolean(unlinkTarget)}
            title="Xüsusiyyət növünü ayır"
            description={`"${unlinkTarget?.attributeName ?? ''}" xüsusiyyət növünü bu kateqoriyadan ayırmaq istədiyinizə əminsiniz?`}
            confirmLabel="Ayır"
            confirmColor="error"
            loading={unlinkMutation.isPending}
            onConfirm={() => {
              if (!unlinkTarget) {
                return;
              }
              unlinkMutation.mutate(unlinkTarget.id, { onSettled: () => setUnlinkTarget(null) });
            }}
            onCancel={() => setUnlinkTarget(null)}
          />
        </>
      )}
    </Box>
  );
}
