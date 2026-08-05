import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { StatusBadge } from '../../../shared/components';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useProducts } from '../hooks/useProducts';
import type { ResolvedProductSearchParams } from '../hooks/useProductSearchParams';
import type { Product, ProductSearchParams } from '../types/product.types';

export interface ProductSearchGridProps {
  params: ResolvedProductSearchParams;
  onParamsChange: (patch: Partial<ProductSearchParams>) => void;
}

export function ProductSearchGrid({ params, onParamsChange }: ProductSearchGridProps) {
  const searchQuery = useProducts(params);
  const { openProduct } = useEntityView();

  const columns: GridColDef<Product>[] = [
    {
      field: 'active',
      headerName: 'Status',
      width: 110,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    { field: 'code', headerName: 'Kod', width: 140, sortable: false },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 240,
      sortable: false,
      renderCell: (cellParams) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2">{cellParams.row.name}</Typography>
          {cellParams.row.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {cellParams.row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 90,
      getActions: (cellParams) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityRoundedIcon />}
          label="Bax"
          onClick={() => openProduct(cellParams.row.id)}
        />,
      ],
    },
  ];

  if (searchQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(searchQuery.error)}</Alert>;
  }

  return (
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
  );
}
