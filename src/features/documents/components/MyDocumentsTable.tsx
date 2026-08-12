import { useMemo } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useMyDocuments } from '../hooks/useDocuments';
import type { CcmsDocument, DocumentSearchParams } from '../types/document.types';
import { DOCUMENT_STATUS } from '../types/document.types';
import { DocumentStatusChip } from './DocumentStatusChip';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface MyDocumentsTableProps {
  params: Required<Pick<DocumentSearchParams, 'page' | 'size'>> & DocumentSearchParams;
  onParamsChange: (patch: Partial<DocumentSearchParams>) => void;
  onDownload: (document: CcmsDocument) => void;
}

export function MyDocumentsTable({ params, onParamsChange, onDownload }: MyDocumentsTableProps) {
  const listQuery = useMyDocuments(params);

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

  const columns: GridColDef<CcmsDocument>[] = [
    { field: 'originalFilename', headerName: 'Fayl adı', flex: 1, minWidth: 220 },
    { field: 'fileSize', headerName: 'Ölçü', width: 100, valueGetter: (_value, row) => formatFileSize(row.fileSize) },
    { field: 'description', headerName: 'Təsvir', flex: 1, minWidth: 180, valueGetter: (_value, row) => row.description ?? '—' },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      sortable: false,
      renderCell: (cellParams) => (
        <Tooltip title={cellParams.row.status === DOCUMENT_STATUS.REJECTED ? (cellParams.row.reviewComment ?? '') : ''}>
          <span>
            <DocumentStatusChip status={cellParams.row.status} />
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Tarix',
      width: 140,
      valueGetter: (_value, row) => dayjs(row.createdAt).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (cellParams) => (
        <Tooltip title="Endir">
          <IconButton size="small" onClick={() => onDownload(cellParams.row)}>
            <DownloadRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (listQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(listQuery.error)}</Alert>;
  }

  return (
    <DataGrid
      autoHeight
      rows={listQuery.data?.content ?? []}
      rowCount={listQuery.data?.totalElements ?? 0}
      loading={listQuery.isFetching}
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
        onParamsChange({ sort: `${model[0].field},${model[0].sort ?? 'asc'}` });
      }}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      localeText={{ noRowsLabel: 'Hələ heç bir sənəd yüklənməyib.' }}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
      }}
    />
  );
}
