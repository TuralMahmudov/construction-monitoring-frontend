import { useState } from 'react';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { ConfirmDialog, StatusBadge } from '../../../shared/components';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { OrganizationType } from '../../admin/organizations/types/organization.types';
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

// § 3.2 — code/name/description read from resource.product.*, but
// specification/manufacturer/brand read directly from resource.* (2026-07-31
// — these are listing-specific, not product identity). Category/unit columns
// dropped: category duplicated "Ad" for how this catalog is actually
// categorized, unit replaced by specification (more useful per-listing).
export function ResourceSearchGrid({ params, onParamsChange, canEdit }: ResourceSearchGridProps) {
  const searchQuery = useResourceSearch(params);
  const deleteMutation = useDeleteResource();
  const { openResource } = useEntityView();
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const columns: GridColDef<Resource>[] = [
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    { field: 'code', headerName: 'Kod', width: 140, sortable: false, valueGetter: (_v, row) => row.product.code },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 240,
      sortable: false,
      renderCell: (cellParams) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2">{cellParams.row.product.name}</Typography>
          {cellParams.row.product.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {cellParams.row.product.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'specification',
      headerName: 'Spesifikasiya',
      width: 200,
      sortable: false,
      valueGetter: (_value, row) => row.specification ?? '—',
    },
    { field: 'manufacturer', headerName: 'İstehsalçı', width: 160, sortable: false, valueGetter: (_v, row) => row.manufacturer ?? '—' },
    { field: 'brand', headerName: 'Brend', width: 140, sortable: false, valueGetter: (_v, row) => row.brand ?? '—' },
    {
      field: 'organizationId',
      headerName: 'Təşkilat',
      width: 150,
      sortable: false,
      renderCell: (cellParams) => (
        <OrganizationChip
          organizationName={cellParams.row.organizationName}
          organizationType={cellParams.row.organizationType as OrganizationType | null}
        />
      ),
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
            onClick={() => openResource(cellParams.row.id)}
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
        getRowHeight={() => 'auto'}
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
