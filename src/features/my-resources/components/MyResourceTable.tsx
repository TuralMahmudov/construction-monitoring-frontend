import dayjs from 'dayjs';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useCategoryNameLookup, useUnitLookup } from '../../resources/hooks/useLookups';
import { useMyResources } from '../hooks/useMyResources';
import type { MyResource, MyResourceSearchParams } from '../types/myResource.types';
import { StatusChip } from './StatusChip';

export interface MyResourceTableProps {
  params: Required<Pick<MyResourceSearchParams, 'page' | 'size'>> & MyResourceSearchParams;
  onParamsChange: (patch: Partial<MyResourceSearchParams>) => void;
  onView: (resource: MyResource) => void;
  onManagePrice: (resource: MyResource) => void;
}

export function MyResourceTable({ params, onParamsChange, onView, onManagePrice }: MyResourceTableProps) {
  const searchQuery = useMyResources(params);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();

  const columns: GridColDef<MyResource>[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      sortable: false,
      renderCell: (cellParams) => <StatusChip status={cellParams.row.status} label={cellParams.row.statusLabel} />,
    },
    {
      field: 'categoryId',
      headerName: 'Kateqoriya',
      width: 180,
      sortable: false,
      valueGetter: (_value, row) => categoryNames.get(row.categoryId) ?? '—',
    },
    { field: 'name', headerName: 'Ad', flex: 1, minWidth: 200 },
    { field: 'manufacturer', headerName: 'İstehsalçı', width: 160 },
    { field: 'brand', headerName: 'Brend', width: 140, valueGetter: (_value, row) => row.brand ?? '—' },
    { field: 'model', headerName: 'Model', width: 140, valueGetter: (_value, row) => row.model ?? '—' },
    {
      field: 'unitId',
      headerName: 'Vahid',
      width: 100,
      sortable: false,
      valueGetter: (_value, row) => unitSymbols.get(row.unitId) ?? '—',
    },
    {
      field: 'createdDate',
      headerName: 'Yaradılma tarixi',
      width: 150,
      valueGetter: (_value, row) => dayjs(row.createdDate).format('DD.MM.YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <Tooltip title="Resursa bax">
            <IconButton size="small" onClick={() => onView(cellParams.row)}>
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Qiymət əlavə et / redaktə et">
            <IconButton size="small" onClick={() => onManagePrice(cellParams.row)}>
              <PriceChangeRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={cellParams.row.hasPrice ? 'Qiymət əlavə olunub' : 'Qiymət yoxdur'}>
            <CircleRoundedIcon sx={{ fontSize: 10, color: cellParams.row.hasPrice ? 'success.main' : 'text.disabled' }} />
          </Tooltip>
        </Stack>
      ),
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
      getRowHeight={() => 56}
      localeText={{ noRowsLabel: 'Nəticə tapılmadı' }}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
      }}
    />
  );
}
