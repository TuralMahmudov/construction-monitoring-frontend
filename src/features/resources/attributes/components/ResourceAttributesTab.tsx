import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import { useAuth } from '../../../../hooks/useAuth';
import { ConfirmDialog } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { canWrite } from '../../../../shared/lib/permissions';
import {
  useCreateResourceAttribute,
  useDeleteResourceAttribute,
  useResourceAttributes,
  useUpdateResourceAttribute,
} from '../hooks/useResourceAttributes';
import type { ResourceAttribute, ResourceAttributeFormValues } from '../types/resourceAttribute.types';
import { ResourceAttributeFormDialog } from './ResourceAttributeFormDialog';

export interface ResourceAttributesTabProps {
  resourceId: string;
}

export function ResourceAttributesTab({ resourceId }: ResourceAttributesTabProps) {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);

  const attributesQuery = useResourceAttributes(resourceId);
  const createMutation = useCreateResourceAttribute(resourceId);
  const updateMutation = useUpdateResourceAttribute(resourceId);
  const deleteMutation = useDeleteResourceAttribute(resourceId);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    attribute: ResourceAttribute | null;
  }>({ open: false, mode: 'create', attribute: null });
  const [deleteTarget, setDeleteTarget] = useState<ResourceAttribute | null>(null);

  function closeDialog() {
    setDialog({ open: false, mode: 'create', attribute: null });
  }

  function handleSubmit(values: ResourceAttributeFormValues, onError: (error: unknown) => void) {
    if (dialog.mode === 'edit' && dialog.attribute) {
      updateMutation.mutate(
        { id: dialog.attribute.id, payload: values },
        { onSuccess: closeDialog, onError },
      );
    } else {
      createMutation.mutate(values, { onSuccess: closeDialog, onError });
    }
  }

  if (attributesQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (attributesQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(attributesQuery.error)}</Alert>;
  }

  const attributes = attributesQuery.data ?? [];

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        {canEdit && (
          <Button
            startIcon={<AddRoundedIcon />}
            variant="contained"
            onClick={() => setDialog({ open: true, mode: 'create', attribute: null })}
          >
            Yeni xüsusiyyət
          </Button>
        )}
      </Stack>

      {attributes.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Hələ heç bir xüsusiyyət yoxdur.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ad</TableCell>
                <TableCell>Dəyər</TableCell>
                <TableCell>Vahid</TableCell>
                <TableCell align="center">Sıra</TableCell>
                <TableCell align="center">Axtarışda</TableCell>
                <TableCell align="center">Məcburi</TableCell>
                <TableCell align="center">Status</TableCell>
                {canEdit && <TableCell align="right">Əməliyyatlar</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id} hover>
                  <TableCell>{attribute.attributeName}</TableCell>
                  <TableCell>{attribute.attributeValue}</TableCell>
                  <TableCell>{attribute.unit ?? '—'}</TableCell>
                  <TableCell align="center">{attribute.sortOrder}</TableCell>
                  <TableCell align="center">
                    {attribute.searchable ? <Chip size="small" label="Bəli" color="success" /> : '—'}
                  </TableCell>
                  <TableCell align="center">
                    {attribute.required ? <Chip size="small" label="Bəli" /> : '—'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={attribute.active ? 'Aktiv' : 'Deaktiv'}
                      color={attribute.active ? 'success' : 'default'}
                      variant={attribute.active ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => setDialog({ open: true, mode: 'edit', attribute })}
                        aria-label="redaktə et"
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(attribute)}
                        aria-label="sil"
                      >
                        <DeleteRoundedIcon fontSize="small" color="error" />
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
          <ResourceAttributeFormDialog
            open={dialog.open}
            mode={dialog.mode}
            editValues={
              dialog.attribute
                ? {
                    attributeName: dialog.attribute.attributeName,
                    attributeValue: dialog.attribute.attributeValue,
                    unit: dialog.attribute.unit ?? '',
                    sortOrder: dialog.attribute.sortOrder,
                    searchable: dialog.attribute.searchable,
                    required: dialog.attribute.required,
                    active: dialog.attribute.active,
                  }
                : null
            }
            isSubmitting={isSubmitting}
            onClose={closeDialog}
            onSubmit={handleSubmit}
          />

          <ConfirmDialog
            open={Boolean(deleteTarget)}
            title="Xüsusiyyəti sil"
            description={`"${deleteTarget?.attributeName ?? ''}" xüsusiyyətini silmək istədiyinizə əminsiniz?`}
            confirmLabel="Sil"
            confirmColor="error"
            loading={deleteMutation.isPending}
            onConfirm={() => {
              if (!deleteTarget) {
                return;
              }
              deleteMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
            }}
            onCancel={() => setDeleteTarget(null)}
          />
        </>
      )}
    </Box>
  );
}
