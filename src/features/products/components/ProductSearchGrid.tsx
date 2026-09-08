import type { ReactNode } from 'react';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { StatusBadge } from '../../../shared/components';
import { useEntityView } from '../../../shared/entity-view/EntityViewProvider';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { productDisplayLabel } from '../../../shared/lib/productLabel';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
import { useAllUnits } from '../../reference-data/hooks/useReferenceOptions';
import { useProducts } from '../hooks/useProducts';
import type { ResolvedProductSearchParams } from '../hooks/useProductSearchParams';
import type { Product, ProductSearchParams } from '../types/product.types';

export interface ProductSearchGridProps {
  params: ResolvedProductSearchParams;
  onParamsChange: (patch: Partial<ProductSearchParams>) => void;
}

// Plain-string cells stay top-aligned under getRowHeight="auto" (MUI DataGrid
// disables flex-centering once row height is dynamic) while the Ad column's
// own Typography+padding makes it look centered — wrapping every text cell
// the same way keeps rows visually consistent.
function CellText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="body2" sx={{ py: 1.5 }}>
      {children}
    </Typography>
  );
}

export function ProductSearchGrid({ params, onParamsChange }: ProductSearchGridProps) {
  const searchQuery = useProducts(params);
  const { openProduct } = useEntityView();
  const unitsQuery = useAllUnits();
  const unitNameById = new Map((unitsQuery.data?.content ?? []).map((unit) => [unit.id, unit.name]));

  const columns: GridColDef<Product>[] = [
    {
      field: 'code',
      headerName: 'Kod',
      width: 140,
      sortable: false,
      renderCell: (cellParams) => <CellText>{cellParams.row.code}</CellText>,
    },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 240,
      sortable: false,
      // bax productDisplayLabel — description only wins when it actually adds
      // the attribute summary; a bare category-name description (attributeless
      // categories) would otherwise hide the product's real, distinguishing name.
      renderCell: (cellParams) => <CellText>{productDisplayLabel(cellParams.row.name, cellParams.row.description)}</CellText>,
    },
    {
      field: 'unitId',
      headerName: 'Vahid',
      width: 140,
      sortable: false,
      renderCell: (cellParams) => (
        <CellText>{cellParams.row.unitId ? (unitNameById.get(cellParams.row.unitId) ?? '—') : '—'}</CellText>
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
      pageSizeOptions={[10, 25, 50, 100]}
      disableRowSelectionOnClick
      localeText={{ ...azGridLocaleText, noRowsLabel: 'Nəticə tapılmadı' }}
    />
  );
}
