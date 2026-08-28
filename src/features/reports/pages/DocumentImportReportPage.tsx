import { useMemo, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { exportToExcel } from '../../../shared/lib/exportToExcel';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { canReviewDocuments } from '../../../shared/lib/permissions';
import { currentQuarter, formatPeriod, quarterToRoman } from '../../../shared/lib/period';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
import { getDocuments } from '../../documents/api/documentsApi';
import { useDocumentOrganizationOptions } from '../../documents/hooks/useDocumentOrganizationOptions';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { DocumentStatusChip } from '../../documents/components/DocumentStatusChip';
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_LABELS,
  type CcmsDocument,
  type DocumentSearchParams,
  type DocumentStatus,
} from '../../documents/types/document.types';

const PAGE_SIZE = 25;
const EXPORT_PAGE_SIZE = 200;
const QUARTERS = [1, 2, 3, 4];
const STATUS_OPTIONS = Object.values(DOCUMENT_STATUS) as DocumentStatus[];

export function DocumentImportReportPage() {
  const { user } = useAuth();
  const canAccess = canReviewDocuments(user);
  const { enqueueSnackbar } = useSnackbar();

  const [organizationId, setOrganizationId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<DocumentStatus | ''>('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number | ''>(currentQuarter());
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE });
  const [isExporting, setIsExporting] = useState(false);

  const orgOptions = useDocumentOrganizationOptions(canAccess);

  const filters: DocumentSearchParams = {
    organizationId,
    status: status || undefined,
    periodYear: year || undefined,
    periodQuarter: quarter || undefined,
  };

  const documentsQuery = useDocuments(
    { ...filters, page: paginationModel.page, size: paginationModel.pageSize },
    canAccess,
  );

  const rows = useMemo(() => documentsQuery.data?.content ?? [], [documentsQuery.data]);
  const totalElements = documentsQuery.data?.totalElements ?? 0;

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  async function handleExport() {
    if (totalElements === 0) {
      enqueueSnackbar('İxrac ediləcək məlumat yoxdur.', { variant: 'info' });
      return;
    }

    setIsExporting(true);
    try {
      const allRows: CcmsDocument[] = [];
      let page = 0;
      for (;;) {
        const pageResponse = await getDocuments({ ...filters, page, size: EXPORT_PAGE_SIZE });
        allRows.push(...pageResponse.content);
        if (pageResponse.last || pageResponse.content.length === 0) {
          break;
        }
        page += 1;
      }

      const exportRows = allRows.map((doc) => ({
        Təşkilat: doc.organizationName,
        'Fayl adı': doc.originalFilename,
        Status: DOCUMENT_STATUS_LABELS[doc.status],
        Rüb: formatPeriod(doc.periodYear, doc.periodQuarter),
        Yükləyən: doc.uploadedByName,
        'Yüklənmə tarixi': dayjs(doc.createdAt).format('DD.MM.YYYY HH:mm'),
        'Emal edən': doc.processedByName ?? '—',
        'Emal tarixi': doc.processedDate ? dayjs(doc.processedDate).format('DD.MM.YYYY HH:mm') : '—',
        Rəy: doc.reviewComment ?? '—',
      }));

      exportToExcel(exportRows, 'Senedidxal_Hesabati.xlsx');
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  }

  const columns: GridColDef<CcmsDocument>[] = [
    { field: 'organizationName', headerName: 'Təşkilat', width: 180, sortable: false },
    { field: 'originalFilename', headerName: 'Fayl adı', flex: 1, minWidth: 200, sortable: false },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: false,
      renderCell: (params) => <DocumentStatusChip status={params.row.status} />,
    },
    {
      field: 'period',
      headerName: 'Rüb',
      width: 90,
      sortable: false,
      valueGetter: (_v, row) => formatPeriod(row.periodYear, row.periodQuarter),
    },
    { field: 'uploadedByName', headerName: 'Yükləyən', width: 140, sortable: false },
    {
      field: 'createdAt',
      headerName: 'Yüklənmə tarixi',
      width: 150,
      sortable: false,
      valueGetter: (_v, row) => dayjs(row.createdAt).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'processedByName',
      headerName: 'Emal edən',
      width: 140,
      sortable: false,
      valueGetter: (_v, row) => row.processedByName ?? '—',
    },
    {
      field: 'processedDate',
      headerName: 'Emal tarixi',
      width: 150,
      sortable: false,
      valueGetter: (_v, row) => (row.processedDate ? dayjs(row.processedDate).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      field: 'reviewComment',
      headerName: 'Rəy',
      flex: 1,
      minWidth: 160,
      sortable: false,
      valueGetter: (_v, row) => row.reviewComment ?? '—',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Sənəd/İdxal Hesabatı"
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button component={RouterLink} to="/reports" startIcon={<ArrowBackRoundedIcon />}>
              Hesabatlara qayıt
            </Button>
            <Button
              variant="contained"
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />}
              onClick={handleExport}
              disabled={isExporting || totalElements === 0}
            >
              Excel-ə çıxar
            </Button>
          </Stack>
        }
      />

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Autocomplete
              options={orgOptions}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={orgOptions.find((org) => org.id === organizationId) ?? null}
              onChange={(_event, newValue) => setOrganizationId(newValue?.id ?? undefined)}
              sx={{ minWidth: 220 }}
              renderInput={(params) => <TextField {...params} label="Təşkilat" placeholder="Hamısı" />}
            />
            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value === '' ? '' : (Number(event.target.value) as DocumentStatus))}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Hamısı</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {DOCUMENT_STATUS_LABELS[s]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              label="İl"
              value={year}
              onChange={(event) => setYear(event.target.value === '' ? '' : Number(event.target.value))}
              sx={{ minWidth: 120 }}
            />
            <TextField
              select
              label="Rüb"
              value={quarter}
              onChange={(event) => setQuarter(event.target.value === '' ? '' : Number(event.target.value))}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">Bütün rüblər</MenuItem>
              {QUARTERS.map((q) => (
                <MenuItem key={q} value={q}>
                  {quarterToRoman(q)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {documentsQuery.isError && <Alert severity="error">{getApiErrorMessage(documentsQuery.error)}</Alert>}

      {!documentsQuery.isError && (
        <Card>
          <DataGrid
            autoHeight
            rows={rows}
            rowCount={totalElements}
            loading={documentsQuery.isFetching}
            columns={columns}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            localeText={{ ...azGridLocaleText, noRowsLabel: 'Seçilmiş filtrlərə uyğun sənəd yoxdur.' }}
          />
        </Card>
      )}
    </PageContainer>
  );
}
