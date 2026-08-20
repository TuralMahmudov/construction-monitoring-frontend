import { useMemo } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
import { useDocumentResourceCounts } from '../hooks/useDocumentResourceCounts';
import { useDocuments } from '../hooks/useDocuments';
import { DOCUMENT_STATUS, type CcmsDocument, type DocumentSearchParams } from '../types/document.types';
import { DocumentStatusChip } from './DocumentStatusChip';

export interface DocumentsAdminTableProps {
  params: Required<Pick<DocumentSearchParams, 'page' | 'size'>> & DocumentSearchParams;
  onParamsChange: (patch: Partial<DocumentSearchParams>) => void;
  currentUserId: string;
  onDownload: (document: CcmsDocument) => void;
  onProcess: (document: CcmsDocument) => void;
  onViewResources: (document: CcmsDocument) => void;
  onReject: (document: CcmsDocument) => void;
}

export function DocumentsAdminTable({
  params,
  onParamsChange,
  currentUserId,
  onDownload,
  onProcess,
  onViewResources,
  onReject,
}: DocumentsAdminTableProps) {
  const listQuery = useDocuments(params);

  // NEW documents can't have any resources yet — excluding them keeps the
  // per-row count queries limited to rows where the answer is actually
  // unknown (bax useDocumentResourceCounts).
  const countableDocumentIds = useMemo(
    () => (listQuery.data?.content ?? []).filter((doc) => doc.status !== DOCUMENT_STATUS.NEW).map((doc) => doc.id),
    [listQuery.data],
  );
  const resourceCounts = useDocumentResourceCounts(countableDocumentIds);

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
    // organizationName/uploadedByName are joined display names, not sortable
    // columns on the backend entity — sorting by them 500s.
    { field: 'organizationName', headerName: 'Təşkilat', width: 200, sortable: false },
    { field: 'originalFilename', headerName: 'Fayl', flex: 1, minWidth: 220 },
    { field: 'uploadedByName', headerName: 'Yükləyən', width: 140, sortable: false },
    {
      field: 'createdAt',
      headerName: 'Tarix',
      width: 140,
      valueGetter: (_value, row) => dayjs(row.createdAt).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'processedByName',
      headerName: 'Hazırlayan',
      width: 140,
      sortable: false,
      valueGetter: (_value, row) => row.processedByName ?? '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      sortable: false,
      renderCell: (cellParams) => {
        const row = cellParams.row;
        // processedByName has its own column now — only REJECTED still needs
        // a tooltip (reviewComment has nowhere else to show at a glance).
        const tooltip = row.status === DOCUMENT_STATUS.REJECTED ? (row.reviewComment ?? '') : '';
        return (
          <Tooltip title={tooltip}>
            <span>
              <DocumentStatusChip status={row.status} />
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'resourceCount',
      headerName: 'Resurs sayı',
      width: 110,
      sortable: false,
      renderCell: (cellParams) => {
        const row = cellParams.row;
        if (row.status === DOCUMENT_STATUS.NEW) {
          return <span>—</span>;
        }
        const count = resourceCounts.get(row.id);
        return count === undefined ? <span>…</span> : <Chip size="small" label={count} variant="outlined" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: 170,
      sortable: false,
      filterable: false,
      renderCell: (cellParams) => {
        const row = cellParams.row;
        const isMyLock = row.processedBy === currentUserId;
        const isLockedByOther = row.status === DOCUMENT_STATUS.IN_PROGRESS && !isMyLock;
        const canProcess = row.status === DOCUMENT_STATUS.NEW || (row.status === DOCUMENT_STATUS.IN_PROGRESS && isMyLock);
        // Backend allows any DOCUMENT_REVIEW holder to reject regardless of
        // lock ownership (§ 2.3), but UX-wise nobody should be able to
        // reject a document while someone else is actively processing it —
        // only NEW, or IN_PROGRESS under your own lock.
        const canReject = row.status === DOCUMENT_STATUS.NEW || (row.status === DOCUMENT_STATUS.IN_PROGRESS && isMyLock);

        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Endir">
              <IconButton size="small" onClick={() => onDownload(row)}>
                <DownloadRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {row.status !== DOCUMENT_STATUS.NEW && (
              // IN_PROGRESS/REJECTED sənədlərin də (COMPLETED-dən əvvəl)
              // artıq yaratdığı resursları ola bilər — yalnız NEW-da hələ
              // heç nə yaranmayıb, ona görə yalnız o istisna edilir.
              <Tooltip title="Yaranan resurslara bax">
                <IconButton size="small" onClick={() => onViewResources(row)}>
                  <VisibilityRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {canProcess && (
              <Tooltip title={isMyLock ? 'Emala davam et' : 'Emal et'}>
                <IconButton size="small" color="primary" onClick={() => onProcess(row)}>
                  <PlayArrowRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {isLockedByOther && (
              <Tooltip title={`${row.processedByName ?? 'Başqa işçi'} tərəfindən emal olunur`}>
                <span>
                  <IconButton size="small" disabled>
                    <PlayArrowRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {canReject && (
              <Tooltip title="Rədd et">
                <IconButton size="small" color="error" onClick={() => onReject(row)}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
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
      localeText={{ ...azGridLocaleText, noRowsLabel: 'Sənəd tapılmadı.' }}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
      }}
    />
  );
}
