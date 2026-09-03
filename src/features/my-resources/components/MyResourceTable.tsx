import { useMemo } from 'react';
import dayjs from 'dayjs';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
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

  const columns: GridColDef<MyResource>[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      sortable: false,
      renderCell: (cellParams) => <StatusChip status={cellParams.row.status} label={cellParams.row.statusLabel} />,
    },
    { field: 'code', headerName: 'Kod', width: 140 },
    {
      field: 'name',
      headerName: 'Ad',
      flex: 1,
      minWidth: 240,
      // `description` is server-generated as "{category name} — {attr: val,
      // ...}" and `name` usually defaults to that same category name, so
      // showing both stacked just repeated the same text twice — description
      // alone already carries everything meaningful.
      renderCell: (cellParams) => (
        <Typography variant="body2" sx={{ py: 1.5 }}>
          {cellParams.row.description || cellParams.row.name}
        </Typography>
      ),
    },
    { field: 'manufacturer', headerName: 'İstehsalçı', width: 160 },
    { field: 'model', headerName: 'Model', width: 100, valueGetter: (_value, row) => row.model ?? '—' },
    {
      field: 'specification',
      headerName: 'Spesifikasiya',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => row.specification ?? '—',
    },
    {
      field: 'createdDate',
      headerName: 'Yaradılma tarixi',
      width: 120,
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

  // Memoized so the array reference only changes when params.sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel: GridSortModel = useMemo(
    () =>
      params.sort
        ? [
            {
              field: params.sort.split(',')[0],
              sort: params.sort.split(',')[1] === 'desc' ? 'desc' : 'asc',
            },
          ]
        : [],
    [params.sort],
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
      getRowHeight={() => 'auto'}
      localeText={{ ...azGridLocaleText, noRowsLabel: 'Nəticə tapılmadı' }}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
      }}
    />
  );
}
