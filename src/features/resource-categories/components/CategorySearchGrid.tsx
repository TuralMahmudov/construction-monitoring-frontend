import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Alert from '@mui/material/Alert';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { ConfirmDialog, StatusBadge } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import type { ResolvedCategorySearchParams } from '../hooks/useCategorySearchParams';
import { useCategorySearch } from '../hooks/useCategorySearch';
import { useDeleteCategory } from '../hooks/useDeleteCategory';
import { useToggleCategoryActive } from '../hooks/useToggleCategoryActive';
import { useCategoryUiStore } from '../store/categoryUiStore';
import { getCategoryTypeLabel } from '../types/resourceCategory.types';
import type { CategorySearchParams, ResourceCategory } from '../types/resourceCategory.types';

export interface CategorySearchGridProps {
  params: ResolvedCategorySearchParams;
  onParamsChange: (patch: Partial<CategorySearchParams>) => void;
  onEdit: (category: ResourceCategory) => void;
}

export function CategorySearchGrid({ params, onParamsChange, onEdit }: CategorySearchGridProps) {
  const navigate = useNavigate();
  const searchQuery = useCategorySearch(params);
  const deleteMutation = useDeleteCategory();
  const toggleActiveMutation = useToggleCategoryActive();
  const focusNode = useCategoryUiStore((state) => state.focusNode);
  const [deleteTarget, setDeleteTarget] = useState<ResourceCategory | null>(null);

  function handleViewInTree(category: ResourceCategory) {
    focusNode(category.id);
    navigate('/resource-categories');
  }

  const columns: GridColDef<ResourceCategory>[] = [
    { field: 'code', headerName: 'Kod', width: 140 },
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
      width: 170,
      getActions: (cellParams) => [
        <GridActionsCellItem
          key="view"
          icon={<AccountTreeRoundedIcon />}
          label="Ağacda göstər"
          onClick={() => handleViewInTree(cellParams.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditRoundedIcon />}
          label="Redaktə et"
          onClick={() => onEdit(cellParams.row)}
        />,
        <GridActionsCellItem
          key="toggle-active"
          icon={cellParams.row.active ? <BlockRoundedIcon /> : <CheckCircleRoundedIcon />}
          label={cellParams.row.active ? 'Deaktiv et' : 'Aktivləşdir'}
          onClick={() =>
            toggleActiveMutation.mutate({ category: cellParams.row, active: !cellParams.row.active })
          }
          showInMenu
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteRoundedIcon color="error" />}
          label="Sil"
          onClick={() => setDeleteTarget(cellParams.row)}
          showInMenu
        />,
      ],
    },
  ];

  const sortModel: GridSortModel = params.sortBy
    ? [{ field: params.sortBy, sort: params.sortDirection }]
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
            return;
          }
          onParamsChange({ sortBy: model[0].field, sortDirection: model[0].sort ?? 'asc' });
        }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Kateqoriyanı sil"
        description={`"${deleteTarget?.name ?? ''}" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`}
        confirmLabel="Sil"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }
          deleteMutation.mutate(
            { id: deleteTarget.id, parentId: deleteTarget.parentId },
            { onSettled: () => setDeleteTarget(null) },
          );
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
