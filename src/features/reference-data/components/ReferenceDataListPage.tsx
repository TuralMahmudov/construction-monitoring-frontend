import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { PageContainer, PageHeader } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ReferenceDataHooks } from '../hooks/createReferenceDataHooks';
import type { BaseReferenceItem, ReferenceDataSearchParams } from '../types/referenceData.types';
import { ReferenceDataFilters } from './ReferenceDataFilters';

export interface ReferenceDataListPageProps<TItem extends BaseReferenceItem> {
  title: string;
  subtitle?: string;
  entityLabelSingular: string;
  columns: GridColDef<TItem>[];
  hooks: Pick<ReferenceDataHooks<TItem, unknown>, 'useList'>;
  canEdit: boolean;
  showCodeFilter?: boolean;
  onAdd: () => void;
  onEdit: (item: TItem) => void;
}

// Deliberately no hard-delete action here — Units/Regions are foreign keys
// on Products/Resources/Prices, and every other reference-style entity in
// this app (Organizations, Products, Resources, Categories) uses an
// active/inactive toggle instead of a real DELETE for exactly that reason.
// Deactivating (via the edit dialog's "Aktiv" switch) is the only lifecycle-
// ending action offered; `useRemove`/`DELETE` still exist in the underlying
// API/hooks layer for any future entity that genuinely needs it, just not
// wired into this shared list UI.
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

  const searchParams: ReferenceDataSearchParams = {
    ...filters,
    page: paginationModel.page,
    size: paginationModel.pageSize,
    sort: sortField ? `${sortField},${sortDirection}` : undefined,
  };

  const listQuery = hooks.useList(searchParams);

  function handleFilterChange(patch: Partial<{ code?: string; name?: string; active?: boolean }>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }

  const actionColumn: GridColDef<TItem> = {
    field: 'actions',
    type: 'actions',
    headerName: 'Əməliyyatlar',
    width: 90,
    getActions: (params) => [
      <GridActionsCellItem
        key="edit"
        icon={<EditRoundedIcon />}
        label="Redaktə et"
        onClick={() => onEdit(params.row)}
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <ReferenceDataFilters
            code={filters.code}
            name={filters.name}
            active={filters.active}
            showCodeFilter={showCodeFilter}
            onChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      <Card>
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
          sx={{
            borderRadius: 2,
            bgcolor: 'background.paper',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
          }}
        />
      </Card>
    </PageContainer>
  );
}
