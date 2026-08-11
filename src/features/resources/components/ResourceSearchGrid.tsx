import { useState } from 'react';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../hooks/useAuth';
import { StatusBadge } from '../../../shared/components';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { canWrite } from '../../../shared/lib/permissions';
import type { OrganizationType } from '../../admin/organizations/types/organization.types';
import { ResourcePriceQuickDialog } from '../prices/components/ResourcePriceQuickDialog';
import type { ResolvedResourceSearchParams } from '../hooks/useResourceSearchParams';
import { useResourceSearch } from '../hooks/useResourceSearch';
import type { Resource, ResourceSearchParams } from '../types/resource.types';
import { OrganizationChip } from './OrganizationChip';

export interface ResourceSearchGridProps {
  params: ResolvedResourceSearchParams;
  onParamsChange: (patch: Partial<ResourceSearchParams>) => void;
}

// § 3.2 — code/name/description read from resource.product.*, but
// specification/manufacturer/brand read directly from resource.* (2026-07-31
// — these are listing-specific, not product identity). Category/unit columns
// dropped: category duplicated "Ad" for how this catalog is actually
// categorized, unit replaced by specification (more useful per-listing).
export function ResourceSearchGrid({ params, onParamsChange }: ResourceSearchGridProps) {
  const { user } = useAuth();
  const canAddPrice = canWrite(user?.roles ?? []);
  const searchQuery = useResourceSearch(params);
  const { openResource } = useEntityView();
  const [priceTarget, setPriceTarget] = useState<Resource | null>(null);

  const columns: GridColDef<Resource>[] = [
    {
      field: 'code',
      headerName: 'Kod',
      width: 140,
      sortable: false,
      valueGetter: (_v, row) => row.product.code,
    },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 240,
      sortable: false,
      // `product.description` is server-generated as "{category name} —
      // {attr: val, ...}" and `product.name` usually defaults to that same
      // category name, so showing both stacked just repeated the same text
      // twice — description alone already carries everything meaningful.
      valueGetter: (_v, row) => row.product.description || row.product.name,
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
      field: 'active',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: canAddPrice ? 130 : 90,
      sortable: false,
      filterable: false,
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Tooltip title="Bax">
            <IconButton size="small" onClick={() => openResource(cellParams.row.id)}>
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canAddPrice && (
            <Tooltip title="Qiymət əlavə et">
              <IconButton size="small" onClick={() => setPriceTarget(cellParams.row)}>
                <PriceChangeRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={cellParams.row.hasPrice ? 'Qiymət əlavə olunub' : 'Qiymət yoxdur'}>
            <CircleRoundedIcon sx={{ fontSize: 10, color: cellParams.row.hasPrice ? 'success.main' : 'text.disabled' }} />
          </Tooltip>
        </Stack>
      ),
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
        sx={{ '& .MuiDataGrid-cell': { alignItems: 'center', py: 1.5 } }}
      />

      <ResourcePriceQuickDialog
        open={priceTarget !== null}
        resourceId={priceTarget?.id ?? null}
        resourceLabel={priceTarget ? `${priceTarget.product.code} — ${priceTarget.product.description || priceTarget.product.name}` : ''}
        organizationId={priceTarget?.organizationId ?? null}
        onClose={() => setPriceTarget(null)}
      />
    </>
  );
}
