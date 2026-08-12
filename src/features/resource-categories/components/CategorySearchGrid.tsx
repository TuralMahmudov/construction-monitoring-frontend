import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { StatusBadge } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResolvedCategorySearchParams } from '../hooks/useCategorySearchParams';
import { useCategorySearch } from '../hooks/useCategorySearch';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { getCategoryTypeLabel } from '../types/resourceCategory.types';
import type { CategorySearchParams, ResourceCategory } from '../types/resourceCategory.types';

export interface CategorySearchGridProps {
  params: ResolvedCategorySearchParams;
  onParamsChange: (patch: Partial<CategorySearchParams>) => void;
}

export function CategorySearchGrid({ params, onParamsChange }: CategorySearchGridProps) {
  const navigate = useNavigate();
  const searchQuery = useCategorySearch(params);
  const focusNode = useCategoryUiStore((state) => state.focusNode);

  function handleViewInTree(category: ResourceCategory) {
    focusNode(category.id);
    navigate('/resource-categories');
  }

  const columns: GridColDef<ResourceCategory>[] = [
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
    {
      field: 'type',
      headerName: 'Növ',
      width: 160,
      valueGetter: (_value, row) => getCategoryTypeLabel(row.type),
    },
    { field: 'level', headerName: 'Səviyyə', width: 100, type: 'number' },
    { field: 'sortOrder', headerName: 'Sıra', width: 90, type: 'number' },
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
      width: 90,
      getActions: (cellParams) => [
        <GridActionsCellItem
          key="view"
          icon={<AccountTreeRoundedIcon />}
          label="Ağacda göstər"
          onClick={() => handleViewInTree(cellParams.row)}
        />,
      ],
    },
  ];

  // Memoized so the array reference only changes when the sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel: GridSortModel = useMemo(
    () => (params.sortBy ? [{ field: params.sortBy, sort: params.sortDirection }] : []),
    [params.sortBy, params.sortDirection],
  );

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
      sortingMode="server"
      sortingOrder={['asc', 'desc']}
      paginationModel={{ page: params.page, pageSize: params.size }}
      onPaginationModelChange={(model) => onParamsChange({ page: model.page, size: model.pageSize })}
      sortModel={sortModel}
      onSortModelChange={(model) => {
        if (model.length === 0) {
          return;
        }
        onParamsChange({ sortBy: model[0].field, sortDirection: model[0].sort ?? 'asc' });
      }}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
    />
  );
}
