import { useMemo, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { exportToExcel } from '../../../shared/lib/exportToExcel';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { canReadCosts } from '../../../shared/lib/permissions';
import { currentQuarter, formatPeriod, quarterToRoman } from '../../../shared/lib/period';
import { azGridLocaleText } from '../../../theme/dataGridLocaleText';
import { CategoryTreeFilterPicker } from '../../resource-categories/components/CategoryTreeFilterPicker';
import { useDebouncedValue } from '../../resources/hooks/useDebouncedValue';
import { useAllRegions } from '../../reference-data/hooks/useReferenceOptions';
import { getPeriodAverages } from '../../resources/prices/api/periodAveragesApi';
import { usePeriodAverages } from '../../resources/prices/hooks/usePeriodAverages';
import { getProductById } from '../../products/api/productsApi';
import { useProductLookup } from '../../products/hooks/useProductLookup';
import { formatSampleCount } from '../../admin/market-averages/utils/formatSampleCount';
import type { PeriodAverageSearchParams, ResourcePricePeriodAverageResponse } from '../../resources/prices/types/periodAverage.types';

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 200;
const QUARTERS = [1, 2, 3, 4];

// Aggregate price fields can come back null for edge-case rows (same
// defensive pattern as elsewhere in this codebase, bax
// FRONTEND_AI_PROMPT_ADMIN_PANEL.md § 4's currentMedianPrice/sampleCount note).
function formatPrice(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toFixed(2);
}

// Export keeps raw numbers where present (sortable/formattable in Excel,
// unlike the fixed-2-decimal display string used on screen).
function priceOrDash(value: number | null | undefined): number | string {
  return value === null || value === undefined ? '—' : value;
}

function formatChangePct(value: number | null): string {
  if (value === null || Number.isNaN(Number(value))) {
    return '—';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function QuarterlyMarketPricesPage() {
  const { user } = useAuth();
  const canAccess = canReadCosts(user);
  const { enqueueSnackbar } = useSnackbar();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState('');
  const [year, setYear] = useState<number | ''>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number | ''>(currentQuarter());
  const [nameInput, setNameInput] = useState('');
  const debouncedName = useDebouncedValue(nameInput, 300);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE });
  const [isExporting, setIsExporting] = useState(false);

  const regionsQuery = useAllRegions(canAccess);

  const filters: PeriodAverageSearchParams = {
    categoryId: categoryId || undefined,
    regionId: regionId || undefined,
    periodYear: year || undefined,
    periodQuarter: quarter || undefined,
    name: debouncedName || undefined,
  };

  const averagesQuery = usePeriodAverages(
    { ...filters, page: paginationModel.page, size: paginationModel.pageSize },
    { enabled: canAccess },
  );

  const rows = useMemo(() => averagesQuery.data?.content ?? [], [averagesQuery.data]);
  const totalElements = averagesQuery.data?.totalElements ?? 0;

  // Index-suffixed row id — the semantic key alone
  // (productId:regionId:periodYear:periodQuarter) is supposed to be unique
  // per FRONTEND_AI_PROMPT_REPORTS.md, but if the backend ever returns more
  // than one row for the same combination, a collision on that key alone
  // would silently drop rows from the grid (DataGrid dedupes by getRowId)
  // while the Excel export — which just dumps the raw API rows with no
  // dedup — would still show all of them. This keeps the two in sync no
  // matter what the backend does.
  const rowsWithId = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        __rowId: `${row.productId}:${row.regionId}:${row.periodYear}:${row.periodQuarter}:${index}`,
      })),
    [rows],
  );

  const productIds = useMemo(() => rows.map((row) => row.productId), [rows]);
  const productLookup = useProductLookup(productIds);

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
      const allRows: ResourcePricePeriodAverageResponse[] = [];
      let page = 0;
      // Filtrlərlə uyğun BÜTÜN səhifələr yığılır — ekrandakı PAGE_SIZE-dan
      // asılı olmayaraq, export tam nəticəni əhatə etməlidir (bax
      // FRONTEND_AI_PROMPT_REPORTS.md § "Excel-ə çıxar" düyməsi, addım 1).
      for (;;) {
        const pageResponse = await getPeriodAverages({ ...filters, page, size: EXPORT_PAGE_SIZE });
        allRows.push(...pageResponse.content);
        if (pageResponse.last || pageResponse.content.length === 0) {
          break;
        }
        page += 1;
      }

      // Ekrandakı "Resurs" sütunu ilə eyni mənbə (product.description) —
      // export bütün rüb/region üzrə səhifələri yığdığı üçün ekrandan daha
      // geniş bir productId dəsti ola bilər, ona görə ayrıca lookup lazımdır
      // (bax productLookup, yalnız cari səhifənin productId-lərini örtür).
      const uniqueProductIds = Array.from(new Set(allRows.map((row) => row.productId)));
      const products = await Promise.all(uniqueProductIds.map((id) => getProductById(id)));
      const descriptionByProductId = new Map(products.map((product) => [product.id, product.description]));

      const exportRows = allRows.map((row) => ({
        Kod: row.productCode,
        Resurs: descriptionByProductId.get(row.productId) || row.resourceName,
        'Ölçü vahidi': row.unitName,
        Region: row.regionName,
        Rüb: formatPeriod(row.periodYear, row.periodQuarter),
        Orta: priceOrDash(row.avgPrice),
        Median: priceOrDash(row.medianPrice),
        Min: priceOrDash(row.minPrice),
        Max: priceOrDash(row.maxPrice),
        Nümunə: formatSampleCount(row.sampleCount, row.resourceCount),
        'Əvvəlki dövr': priceOrDash(row.previousAvgPrice),
        'Dəyişmə %': formatChangePct(row.periodOverPeriodChangePct),
      }));

      const yearSegment = year || 'Butun';
      const quarterSegment = quarter ? quarterToRoman(quarter) : 'Butun';
      exportToExcel(exportRows, `Rublük_Bazar_Qiymeti_${yearSegment}_${quarterSegment}.xlsx`);
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  }

  const columns: GridColDef<(typeof rowsWithId)[number]>[] = [
    { field: 'productCode', headerName: 'Kod', width: 120, sortable: false },
    {
      field: 'resourceName',
      headerName: 'Resurs',
      flex: 1,
      minWidth: 220,
      sortable: false,
      // Kateqoriya adı ayrıca sütun kimi göstərilmir — description onsuz da
      // kateqoriya + atribut dəyərlərini özündə daşıyır (bax
      // project-product-resource-model), ayrıca sütun təkrarçılıqdır.
      valueGetter: (_v, row) => productLookup.get(row.productId)?.description || row.resourceName,
    },
    { field: 'unitName', headerName: 'Ölçü vahidi', width: 110, sortable: false },
    { field: 'regionName', headerName: 'Region', width: 120, sortable: false },
    {
      field: 'period',
      headerName: 'Rüb',
      width: 90,
      sortable: false,
      valueGetter: (_v, row) => formatPeriod(row.periodYear, row.periodQuarter),
    },
    {
      field: 'avgPrice',
      headerName: 'Orta',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatPrice(row.avgPrice),
    },
    {
      field: 'medianPrice',
      headerName: 'Median',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatPrice(row.medianPrice),
    },
    {
      field: 'minPrice',
      headerName: 'Min',
      width: 90,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatPrice(row.minPrice),
    },
    {
      field: 'maxPrice',
      headerName: 'Max',
      width: 90,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatPrice(row.maxPrice),
    },
    {
      field: 'sampleCount',
      headerName: 'Nümunə',
      width: 170,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatSampleCount(row.sampleCount, row.resourceCount),
    },
    {
      field: 'previousAvgPrice',
      headerName: 'Əvvəlki dövr',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      valueGetter: (_v, row) => formatPrice(row.previousAvgPrice),
    },
    {
      field: 'periodOverPeriodChangePct',
      headerName: 'Dəyişmə %',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: (params) => {
        const value = params.row.periodOverPeriodChangePct;
        if (value === null || Number.isNaN(Number(value))) {
          return '—';
        }
        return <Box component="span" sx={{ color: value >= 0 ? 'success.main' : 'error.main' }}>{formatChangePct(value)}</Box>;
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Rüblük Bazar Qiyməti"
        subtitle="Rüblərarası qiymət gedişatı"
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
            <Box sx={{ minWidth: 260, flex: 1 }}>
              <CategoryTreeFilterPicker value={categoryId} onChange={setCategoryId} />
            </Box>
            <TextField
              select
              label="Region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              disabled={regionsQuery.isLoading}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Bütün regionlar</MenuItem>
              {(regionsQuery.data?.content ?? []).map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
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
            <TextField
              label="Resurs adı ilə axtarış"
              placeholder="Məs: Sement"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {averagesQuery.isError && <Alert severity="error">{getApiErrorMessage(averagesQuery.error)}</Alert>}

      {!averagesQuery.isError && (
        <Card>
          <DataGrid
            autoHeight
            rows={rowsWithId}
            rowCount={totalElements}
            getRowId={(row) => row.__rowId}
            loading={averagesQuery.isFetching}
            columns={columns}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[25, 50, 100]}
            getRowHeight={() => 56}
            disableRowSelectionOnClick
            localeText={{ ...azGridLocaleText, noRowsLabel: 'Seçilmiş filtrlərə uyğun məlumat yoxdur.' }}
          />
        </Card>
      )}
    </PageContainer>
  );
}
