import { useNavigate } from 'react-router-dom';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { StatusBadge } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryNameLookup, useUnitLookup } from '../../resources/hooks/useLookups';
import { useProducts } from '../hooks/useProducts';
import type { ResolvedProductSearchParams } from '../hooks/useProductSearchParams';
import type { Product, ProductSearchParams } from '../types/product.types';

export interface ProductSearchGridProps {
  params: ResolvedProductSearchParams;
  onParamsChange: (patch: Partial<ProductSearchParams>) => void;
}

export function ProductSearchGrid({ params, onParamsChange }: ProductSearchGridProps) {
  const navigate = useNavigate();
  const searchQuery = useProducts(params);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();

  const columns: GridColDef<Product>[] = [
    { field: 'code', headerName: 'Kod', width: 140, sortable: false },
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200, sortable: false },
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
    {
      field: 'active',
      headerName: 'Status',
      width: 110,
      sortable: false,
      renderCell: (cellParams) => <StatusBadge active={cellParams.row.active} />,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Əməliyyatlar',
      width: 90,
      getActions: (cellParams) => [
        <GridActionsCellItem
          key="view"
          icon={<VisibilityRoundedIcon />}
          label="Bax"
          onClick={() => navigate(`/products/${cellParams.row.id}`)}
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
      paginationMode="server"
      paginationModel={{ page: params.page, pageSize: params.size }}
      onPaginationModelChange={(model) => onParamsChange({ page: model.page, size: model.pageSize })}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
    />
  );
}
