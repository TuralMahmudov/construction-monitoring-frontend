import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { ConfirmDialog, StatusBadge } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useDeleteResource } from '../hooks/useDeleteResource';
import { useCategoryNameLookup, useUnitLookup } from '../hooks/useLookups';
import type { ResolvedResourceSearchParams } from '../hooks/useResourceSearchParams';
import { useResourceSearch } from '../hooks/useResourceSearch';
import type { Resource, ResourceSearchParams } from '../types/resource.types';

export interface ResourceSearchGridProps {
  params: ResolvedResourceSearchParams;
  onParamsChange: (patch: Partial<ResourceSearchParams>) => void;
  onEdit: (resource: Resource) => void;
  canEdit: boolean;
}

export function ResourceSearchGrid({ params, onParamsChange, onEdit, canEdit }: ResourceSearchGridProps) {
  const navigate = useNavigate();
  const searchQuery = useResourceSearch(params);
  const deleteMutation = useDeleteResource();
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const columns: GridColDef<Resource>[] = [
    { field: 'code', headerName: 'Kod', width: 140 },
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
    {
      field: 'categoryId',
      headerName: 'Kateqoriya',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => categoryNames.get(row.categoryId) ?? '—',
    },
    {
      field: 'unitId',
      headerName: 'Vahid',
      width: 100,
      sortable: false,
      valueGetter: (_value, row) => (row.unitId ? (unitSymbols.get(row.unitId) ?? '—') : '—'),
    },
    { field: 'manufacturer', headerName: 'İstehsalçı', width: 160 },
    { field: 'brand', headerName: 'Brend', width: 140 },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: canEdit ? 150 : 90,
      getActions: (cellParams) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<VisibilityRoundedIcon />}
            label="Bax"
            onClick={() => navigate(`/resources/${cellParams.row.id}`)}
          />,
        ];
        if (canEdit) {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditRoundedIcon />}
              label="Redaktə et"
              onClick={() => onEdit(cellParams.row)}
            />,
            <GridActionsCellItem
              key="delete"
              icon={<DeleteRoundedIcon color="error" />}
              label="Sil"
              onClick={() => setDeleteTarget(cellParams.row)}
              showInMenu
            />,
          );
        }
        return actions;
      },
    },
  ];

  const sortModel: GridSortModel = params.sort
    ? [
        {
          field: params.sort.split(',')[0],
          sort: params.sort.split(',')[1] === 'desc' ? 'desc' : 'asc',
        },
      ]
    : [];

  if (searchQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(searchQuery.error)}</Alert>;
  }

  return (
    <>
      <DataGrid
        autoHeight
        rows={searchQuery.data?.content ?? []}
        rowCount={searchQuery.data?.totalElements ?? 0}
        loading={searchQuery.isFetching}
        columns={columns}
        paginationMode="server"
        sortingMode="server"
        paginationModel={{ page: params.page, pageSize: params.size }}
        onPaginationModelChange={(model) => onParamsChange({ page: model.page, size: model.pageSize })}
        sortModel={sortModel}
        onSortModelChange={(model) => {
          if (model.length === 0) {
            onParamsChange({ sort: undefined });
            return;
          }
          onParamsChange({ sort: `${model[0].field},${model[0].sort ?? 'asc'}` });
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
      />

      {canEdit && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Resursu sil"
          description={`"${deleteTarget?.name ?? ''}" resursunu silmək istədiyinizə əminsiniz?`}
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
    </>
  );
}
