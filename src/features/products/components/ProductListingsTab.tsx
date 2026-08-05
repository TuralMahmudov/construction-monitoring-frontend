import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { StatusBadge } from '../../../shared/components';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { OrganizationType } from '../../admin/organizations/types/organization.types';
import { OrganizationChip } from '../../resources/components/OrganizationChip';
import { useResourceSearch } from '../../resources/hooks/useResourceSearch';
import type { Resource } from '../../resources/types/resource.types';

export interface ProductListingsTabProps {
  productId: string;
}

// § 3.4 — "bu məhsulu satan təşkilatlar": GET /api/resources?product={id}.
export function ProductListingsTab({ productId }: ProductListingsTabProps) {
  const listingsQuery = useResourceSearch({ product: productId, size: 50 });
  const { openResource } = useEntityView();

  if (listingsQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(listingsQuery.error)}</Alert>;
  }

  const columns: GridColDef<Resource>[] = [
    {
      field: 'organizationId',
      headerName: 'Təşkilat',
      flex: 1,
      minWidth: 180,
      sortable: false,
      renderCell: (params) => (
        <OrganizationChip
          organizationName={params.row.organizationName}
          organizationType={params.row.organizationType as OrganizationType | null}
        />
      ),
    },
    {
      field: 'manufacturer',
      headerName: 'İstehsalçı',
      width: 160,
      sortable: false,
      valueGetter: (_value, row) => row.manufacturer ?? '—',
    },
    {
      field: 'brand',
      headerName: 'Brend',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => row.brand ?? '—',
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => row.model ?? '—',
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (params) => <StatusBadge active={params.row.active} />,
    },
    {
      field: 'createdDate',
      headerName: 'Yaradılma tarixi',
      width: 180,
      valueGetter: (_value, row) => new Date(row.createdDate).toLocaleString('az-AZ'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: 90,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityRoundedIcon />}
          label="Bax"
          onClick={() => openResource(params.row.id)}
        />,
      ],
    },
  ];

  return (
    <DataGrid
      autoHeight
      rows={listingsQuery.data?.content ?? []}
      rowCount={listingsQuery.data?.totalElements ?? 0}
      loading={listingsQuery.isFetching}
      columns={columns}
      hideFooter={(listingsQuery.data?.totalElements ?? 0) <= 50}
      disableRowSelectionOnClick
      localeText={{ noRowsLabel: 'Bu məhsulu elan edən təşkilat yoxdur.' }}
    />
  );
}
