import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { ConfirmDialog, PageContainer, PageHeader } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ReferenceDataHooks } from '../hooks/createReferenceDataHooks';
import type { BaseReferenceItem, ReferenceDataSearchParams } from '../types/referenceData.types';
import { ReferenceDataFilters } from './ReferenceDataFilters';

export interface ReferenceDataListPageProps<TItem extends BaseReferenceItem> {
  title: string;
  subtitle?: string;
  entityLabelSingular: string;
  columns: GridColDef<TItem>[];
  hooks: Pick<ReferenceDataHooks<TItem, unknown>, 'useList' | 'useRemove'>;
  canEdit: boolean;
  /** Forwarded to ReferenceDataFilters — see its doc comment. */
  showCodeFilter?: boolean;
  onAdd: () => void;
  onEdit: (item: TItem) => void;
}

/**
 * Shared list/grid/filter/pagination/delete-confirm chrome for a simple
 * code/name/active reference entity. The create/edit dialog itself is left
 * to the caller — react-hook-form + Zod's generics don't compose cleanly
 * through an extra layer of generic form component, so each entity keeps its
 * own small, concretely-typed dialog instead of fighting that friction here.
 */
export function ReferenceDataListPage<TItem extends BaseReferenceItem>({
  title,
  subtitle,
  entityLabelSingular,
  columns,
  hooks,
  canEdit,
  showCodeFilter,
  onAdd,
  onEdit,
}: ReferenceDataListPageProps<TItem>) {
  const [filters, setFilters] = useState<{ code?: string; name?: string; active?: boolean }>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortField, setSortField] = useState<string | undefined>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<TItem | null>(null);

  const searchParams: ReferenceDataSearchParams = {
    ...filters,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: sortField ? `${sortField},${sortDirection}` : undefined,
  };

  const listQuery = hooks.useList(searchParams);
  const removeMutation = hooks.useRemove();

  function handleFilterChange(patch: Partial<{ code?: string; name?: string; active?: boolean }>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

  const actionColumn: GridColDef<TItem> = {
    field: 'actions',
    type: 'actions',
    headerName: 'Əməliyyatlar',
    width: 120,
    getActions: (params) => [
      <GridActionsCellItem
        key="edit"
        icon={<EditRoundedIcon />}
        label="Redaktə et"
        onClick={() => onEdit(params.row)}
      />,
      <GridActionsCellItem
        key="delete"
        icon={<DeleteRoundedIcon color="error" />}
        label="Sil"
        onClick={() => setDeleteTarget(params.row)}
      />,
    ],
  };

  if (listQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(listQuery.error)}</Alert>;
  }

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canEdit ? (
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={onAdd}>
              Yeni
            </Button>
          ) : undefined
        }
      />

      <ReferenceDataFilters
        code={filters.code}
        name={filters.name}
        active={filters.active}
        showCodeFilter={showCodeFilter}
        onChange={handleFilterChange}
      />

      <DataGrid
        autoHeight
        rows={listQuery.data?.content ?? []}
        rowCount={listQuery.data?.totalElements ?? 0}
        loading={listQuery.isFetching}
        columns={canEdit ? [...columns, actionColumn] : columns}
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortField ? [{ field: sortField, sort: sortDirection }] : []}
        onSortModelChange={(model) => {
          if (model.length === 0) {
            return;
          }
          setSortField(model[0].field);
          setSortDirection(model[0].sort ?? 'asc');
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        localeText={{
          noRowsLabel: `Hələ heç bir ${entityLabelSingular} yoxdur — "Yeni" düyməsi ilə əlavə edin.`,
        }}
      />

      {canEdit && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title={`${entityLabelSingular}i sil`}
          description={`"${deleteTarget?.name ?? ''}" adlı ${entityLabelSingular}i silmək istədiyinizə əminsiniz?`}
          confirmLabel="Sil"
          confirmColor="error"
          loading={removeMutation.isPending}
          onConfirm={() => {
            if (!deleteTarget) {
              return;
            }
            removeMutation.mutate(deleteTarget.id, { onSettled: () => setDeleteTarget(null) });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageContainer>
  );
}
