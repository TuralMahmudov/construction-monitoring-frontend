import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { ConfirmDialog, PageContainer, PageHeader, StatusBadge } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { canWrite } from '../../../../shared/lib/permissions';
import { useUnitLookup } from '../../../resources/hooks/useLookups';
import { AttributeDefinitionFormDialog } from '../components/AttributeDefinitionFormDialog';
import { AttributeEnumValuesDialog } from '../components/AttributeEnumValuesDialog';
import {
  useAttributeDefinitionsList,
  useCreateAttributeDefinition,
  useDeleteAttributeDefinition,
  useUpdateAttributeDefinition,
} from '../hooks/useAttributeDefinitions';
import {
  ATTRIBUTE_DATA_TYPE,
  ATTRIBUTE_DATA_TYPE_LABELS,
  ATTRIBUTE_DATA_TYPE_OPTIONS,
  type AttributeDataType,
  type AttributeDefinition,
  type AttributeDefinitionFormValues,
} from '../types/attributeDefinition.types';

export function AttributeDefinitionsPage() {
  const { user } = useAuth();
  const canEdit = canWrite(user?.roles ?? []);
  const unitSymbols = useUnitLookup();

  const [filters, setFilters] = useState<{ name?: string; dataType?: AttributeDataType }>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const listQuery = useAttributeDefinitionsList({
    ...filters,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: 'name,asc',
  });
  const createMutation = useCreateAttributeDefinition();
  const updateMutation = useUpdateAttributeDefinition();
  const deleteMutation = useDeleteAttributeDefinition();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    item: AttributeDefinition | null;
  }>({ open: false, mode: 'create', item: null });
  const [enumDialog, setEnumDialog] = useState<AttributeDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeDefinition | null>(null);

  function closeDialog() {
    setDialog({ open: false, mode: 'create', item: null });
  }

  function handleSubmit(values: AttributeDefinitionFormValues, onError: (error: unknown) => void) {
    if (dialog.mode === 'edit' && dialog.item) {
      updateMutation.mutate({ id: dialog.item.id, payload: values }, { onSuccess: closeDialog, onError });
    } else {
      createMutation.mutate(values, { onSuccess: closeDialog, onError });
    }
  }

  const columns: GridColDef<AttributeDefinition>[] = [
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 180 },
    {
      field: 'dataType',
      headerName: 'Tip',
      width: 140,
      valueGetter: (_value, row) => ATTRIBUTE_DATA_TYPE_LABELS[row.dataType],
    },
    {
      field: 'defaultUnitId',
      headerName: 'Vahid',
      width: 120,
      sortable: false,
      valueGetter: (_value, row) => (row.defaultUnitId ? unitSymbols.get(row.defaultUnitId) ?? '—' : '—'),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (params) => <StatusBadge active={params.row.active} />,
    },
    {
      field: 'enumValues',
      headerName: 'Dəyərlər',
      width: 100,
      sortable: false,
      align: 'center',
      renderCell: (params) =>
        params.row.dataType === ATTRIBUTE_DATA_TYPE.ENUM ? (
          <Tooltip title="Sabit dəyərləri idarə et">
            <IconButton size="small" onClick={() => setEnumDialog(params.row)}>
              <ListAltRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditRoundedIcon />}
          label="Redaktə et"
          onClick={() => setDialog({ open: true, mode: 'edit', item: params.row })}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteRoundedIcon color="error" />}
          label="Sil"
          onClick={() => setDeleteTarget(params.row)}
        />,
      ],
    },
  ];

  if (listQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(listQuery.error)}</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Atribut Lüğəti"
        subtitle="Resurslara bağlana bilən xüsusiyyətlərin qlobal siyahısı (Diametr, Marka, Material və s.)"
        actions={
          canEdit ? (
            <Button
              startIcon={<AddRoundedIcon />}
              variant="contained"
              onClick={() => setDialog({ open: true, mode: 'create', item: null })}
            >
              Yeni atribut
            </Button>
          ) : undefined
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            label="Ad"
            fullWidth
            size="small"
            value={filters.name ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value || undefined }))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            label="Tip"
            fullWidth
            size="small"
            value={filters.dataType ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                dataType: event.target.value
                  ? (Number(event.target.value) as AttributeDataType)
                  : undefined,
              }))
            }
          >
            <MenuItem value="">Hamısı</MenuItem>
            {ATTRIBUTE_DATA_TYPE_OPTIONS.map((type) => (
              <MenuItem key={type} value={type}>
                {ATTRIBUTE_DATA_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          autoHeight
          rows={listQuery.data?.content ?? []}
          rowCount={listQuery.data?.totalElements ?? 0}
          loading={listQuery.isFetching}
          columns={canEdit ? columns : columns.filter((column) => column.field !== 'actions')}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: 'Hələ heç bir atribut yoxdur — "Yeni atribut" ilə əlavə edin.' }}
        />
      </Card>

      {canEdit && (
        <AttributeDefinitionFormDialog
          open={dialog.open}
          mode={dialog.mode}
          editValues={
            dialog.item
              ? {
                  name: dialog.item.name,
                  dataType: dialog.item.dataType,
                  defaultUnitId: dialog.item.defaultUnitId,
                  active: dialog.item.active,
                }
              : null
          }
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onSubmit={handleSubmit}
        />
      )}

      <AttributeEnumValuesDialog
        open={Boolean(enumDialog)}
        definitionId={enumDialog?.id ?? null}
        definitionName={enumDialog?.name ?? ''}
        onClose={() => setEnumDialog(null)}
      />

      {canEdit && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Atributu sil"
          description={`"${deleteTarget?.name ?? ''}" atributunu silmək istədiyinizə əminsiniz?`}
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
      )}
    </PageContainer>
  );
}
