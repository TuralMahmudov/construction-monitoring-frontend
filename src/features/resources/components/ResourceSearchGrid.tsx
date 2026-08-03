import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { ConfirmDialog, StatusBadge } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryNameLookup, useUnitLookup } from '../hooks/useLookups';
import { useDeleteResource } from '../hooks/useDeleteResource';
import type { ResolvedResourceSearchParams } from '../hooks/useResourceSearchParams';
import { useResourceSearch } from '../hooks/useResourceSearch';
import type { Resource, ResourceSearchParams } from '../types/resource.types';
import { OrganizationChip } from './OrganizationChip';

export interface ResourceSearchGridProps {
  params: ResolvedResourceSearchParams;
  onParamsChange: (patch: Partial<ResourceSearchParams>) => void;
  canEdit: boolean;
}

// § 3.2 — code/name/category/unit read from resource.product.*, but
// manufacturer/brand read directly from resource.* (2026-07-31 — these are
// listing-specific, not product identity).
export function ResourceSearchGrid({ params, onParamsChange, canEdit }: ResourceSearchGridProps) {
  const navigate = useNavigate();
  const searchQuery = useResourceSearch(params);
  const deleteMutation = useDeleteResource();
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const columns: GridColDef<Resource>[] = [
    { field: 'code', headerName: 'Kod', width: 140, sortable: false, valueGetter: (_v, row) => row.product.code },
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200, sortable: false, valueGetter: (_v, row) => row.product.name },
    {
      field: 'categoryId',
      headerName: 'Kateqoriya',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => categoryNames.get(row.product.categoryId) ?? '—',
    },
    {
      field: 'unitId',
      headerName: 'Vahid',
      width: 100,
      sortable: false,
      valueGetter: (_value, row) => (row.product.unitId ? (unitSymbols.get(row.product.unitId) ?? '—') : '—'),
    },
    { field: 'manufacturer', headerName: 'İstehsalçı', width: 160, sortable: false, valueGetter: (_v, row) => row.manufacturer ?? '—' },
    { field: 'brand', headerName: 'Brend', width: 140, sortable: false, valueGetter: (_v, row) => row.brand ?? '—' },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    {
      field: 'organizationId',
      headerName: 'Təşkilat',
      width: 150,
      sortable: false,
      renderCell: (cellParams) => <OrganizationChip organizationId={cellParams.row.organizationId} />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: canEdit ? 110 : 90,
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
        paginationModel={{ page: params.page, pageSize: params.size }}
        onPaginationModelChange={(model) => onParamsChange({ page: model.page, size: model.pageSize })}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
      />

      {canEdit && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Elanı sil"
          description={`"${deleteTarget?.product.code ?? ''} — ${deleteTarget?.product.name ?? ''}" elanını silmək istədiyinizə əminsiniz?`}
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
