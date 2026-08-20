import { useEffect, useMemo, useState } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../../shared/components';
import { exportToExcel } from '../../../../shared/lib/exportToExcel';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { azGridLocaleText } from '../../../../theme/dataGridLocaleText';
import { useDebouncedValue } from '../../../resources/hooks/useDebouncedValue';
import { CategoryTreeFilterPicker } from '../../../resource-categories/components/CategoryTreeFilterPicker';
import { getProductById } from '../../../products/api/productsApi';
import { useProductLookup } from '../../../products/hooks/useProductLookup';
import { useAllRegions } from '../../../reference-data/hooks/useReferenceOptions';
import { getPriceAverages } from '../api/priceAveragesApi';
import { usePriceAverages } from '../hooks/usePriceAverages';
import { useAveragesSummary } from '../hooks/useAveragesSummary';
import { useMarketAveragesSearchParams } from '../hooks/useMarketAveragesSearchParams';
import type { ResourcePriceAverageResponse, VariabilityLevelParam } from '../types/priceAverage.types';
import { formatSampleCount } from '../utils/formatSampleCount';
import { computeSampleConfidence } from '../utils/sampleConfidence';
import { computeVariability } from '../utils/priceVariability';
import { MarketAverageDetailDialog } from '../components/MarketAverageDetailDialog';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { StatTile } from '../components/StatTile';
import { VariabilityChip } from '../components/VariabilityChip';

const EXPORT_PAGE_SIZE = 200;

export function MarketAveragesPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);
  const { enqueueSnackbar } = useSnackbar();
  const { params, updateParams } = useMarketAveragesSearchParams();
  const [nameInput, setNameInput] = useState(params.name ?? '');
  const debouncedName = useDebouncedValue(nameInput, 300);
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [detailTarget, setDetailTarget] = useState<ResourcePriceAverageResponse | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  // Memoized so the array reference only changes when the sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel = useMemo(
    () => (sortField ? [{ field: sortField, sort: sortDirection }] : []),
    [sortField, sortDirection],
  );

  // Debounced separately from the URL so every keystroke doesn't push a
  // browser-history entry — only the settled value lands in the URL/query.
  useEffect(() => {
    if (debouncedName !== (params.name ?? '')) {
      updateParams({ name: debouncedName || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  const regionsQuery = useAllRegions(canAccess);

  const baseFilters = {
    name: params.name,
    categoryId: params.categoryId,
    regionId: params.regionId,
  };

  const averagesQuery = usePriceAverages(
    {
      ...baseFilters,
      variabilityLevel: params.variabilityLevel,
      page: params.page,
      size: params.size,
      sort: sortField ? `${sortField},${sortDirection}` : undefined,
    },
    { enabled: canAccess },
  );

  // Independent of variabilityLevel/page — the full-result breakdown across
  // every bucket, so the KPI cards stay accurate no matter which bucket (or
  // which page) is currently selected (bax useAveragesSummary).
  const summaryQuery = useAveragesSummary(baseFilters, { enabled: canAccess });

  const rows = useMemo(() => averagesQuery.data?.content ?? [], [averagesQuery.data]);
  const totalElements = averagesQuery.data?.totalElements ?? 0;
  // `description` (kateqoriya + atribut xülasəsi) bu aggregate cavabında
  // yoxdur (yalnız bare `resourceName`) — Kod/Kateqoriya/Vahid/Region artıq
  // birbaşa cavabda olduğu üçün productLookup YALNIZ description üçün qalır.
  const productIds = useMemo(() => rows.map((row) => row.productId), [rows]);
  const productLookup = useProductLookup(productIds);

  // `.filter(Boolean)` matters here, not just tidiness: until the backend
  // sends `resourceName` (bax MARKET_ANALYTICS_BACKEND_CONTRACT.md), rows
  // carry it as undefined — feeding that straight into Autocomplete's
  // options crashes the whole page, since its default getOptionLabel
  // assumes every non-string option is an {label} object and reads
  // `.label` off of it.
  const nameSuggestions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.resourceName).filter((name): name is string => Boolean(name)))).slice(
        0,
        8,
      ),
    [rows],
  );

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  function toggleVariability(level: VariabilityLevelParam) {
    updateParams({ variabilityLevel: params.variabilityLevel === level ? undefined : level });
  }

  async function handleExport() {
    if (totalElements === 0) {
      enqueueSnackbar('İxrac ediləcək məlumat yoxdur.', { variant: 'info' });
      return;
    }

    setIsExporting(true);
    try {
      const exportFilters = { ...baseFilters, variabilityLevel: params.variabilityLevel };
      const allRows: ResourcePriceAverageResponse[] = [];
      let page = 0;
      for (;;) {
        const pageResponse = await getPriceAverages({ ...exportFilters, page, size: EXPORT_PAGE_SIZE });
        allRows.push(...pageResponse.content);
        if (pageResponse.last || pageResponse.content.length === 0) {
          break;
        }
        page += 1;
      }

      const uniqueProductIds = Array.from(new Set(allRows.map((row) => row.productId)));
      const products = await Promise.all(uniqueProductIds.map((id) => getProductById(id)));
      const descriptionByProductId = new Map(products.map((product) => [product.id, product.description]));

      const exportRows = allRows.map((row) => ({
        Kod: row.productCode,
        Resurs: descriptionByProductId.get(row.productId) || row.resourceName,
        'Ölçü vahidi': row.unitName,
        Region: row.regionName,
        Valyuta: row.currency,
        Orta: row.avgPrice,
        Median: row.medianPrice,
        Min: row.minPrice,
        Max: row.maxPrice,
        Nümunə: formatSampleCount(row.sampleCount, row.resourceCount),
        'Hesablanma tarixi': dayjs(row.calculatedAt).format('DD.MM.YYYY'),
      }));

      exportToExcel(exportRows, 'Canli_Bazar_Qiymeti.xlsx');
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  }

  const columns: GridColDef<ResourcePriceAverageResponse>[] = [
    {
      field: 'code',
      headerName: 'Kod',
      width: 120,
      sortable: false,
      valueGetter: (_v, row) => row.productCode,
    },
    {
      field: 'resourceName',
      headerName: 'Resurs',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_v, row) => productLookup.get(row.productId)?.description || row.resourceName,
    },
    {
      field: 'unitName',
      headerName: 'Ölçü vahidi',
      width: 110,
      sortable: false,
    },
    {
      field: 'regionName',
      headerName: 'Region',
      width: 100,
      sortable: false,
    },
    {
      field: 'medianPrice',
      headerName: 'Median',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_v, row) => `${row.medianPrice.toFixed(2)} ${row.currency}`,
    },
    {
      field: 'range',
      headerName: 'Qiymət aralığı',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <PriceRangeBar
          min={params.row.minPrice}
          max={params.row.maxPrice}
          median={params.row.medianPrice}
          currency={params.row.currency}
        />
      ),
    },
    {
      field: 'variability',
      headerName: 'Dəyişkənlik',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <VariabilityChip
          variability={computeVariability(params.row.minPrice, params.row.maxPrice, params.row.medianPrice)}
        />
      ),
    },
    {
      field: 'sampleCount',
      headerName: 'Nümunə',
      width: 175,
      align: 'right',
      headerAlign: 'right',
      sortable: false,
      renderCell: (params) => {
        const confidence = computeSampleConfidence(params.row.sampleCount);
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
            {confidence.level !== 'normal' && (
              <Tooltip title={`${confidence.label} — az sayda təşkilatın qiymətinə əsaslanır`}>
                <WarningAmberRoundedIcon
                  fontSize="small"
                  color={confidence.level === 'low' ? 'warning' : 'action'}
                />
              </Tooltip>
            )}
            <span>{formatSampleCount(params.row.sampleCount, params.row.resourceCount)}</span>
          </Stack>
        );
      },
    },
    {
      field: 'calculatedAt',
      headerName: 'Son hesablanma',
      width: 130,
      valueGetter: (_v, row) => dayjs(row.calculatedAt).format('DD.MM.YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Ətraflı bax">
          <IconButton size="small" onClick={() => setDetailTarget(params.row)}>
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Bazar Qiymətləri Analitikası"
        subtitle="Bütün təşkilatların təsdiqlənmiş qiymətlərindən hesablanmış region üzrə bazar statistikası"
        actions={
          <Button
            variant="contained"
            startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />}
            onClick={handleExport}
            disabled={isExporting || totalElements === 0}
          >
            Excel-ə çıxar
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <StatTile label="Cəmi qrup (filtrə uyğun)" value={totalElements} />
        <StatTile
          label="Stabil"
          value={summaryQuery.data?.stableCount ?? '—'}
          color="success.main"
          selected={params.variabilityLevel === 'STABLE'}
          onClick={() => toggleVariability('STABLE')}
        />
        <StatTile
          label="Orta dəyişkənlik"
          value={summaryQuery.data?.moderateCount ?? '—'}
          color="warning.main"
          selected={params.variabilityLevel === 'MODERATE'}
          onClick={() => toggleVariability('MODERATE')}
        />
        <StatTile
          label="Yüksək dəyişkənlik"
          value={summaryQuery.data?.highCount ?? '—'}
          color="error.main"
          selected={params.variabilityLevel === 'HIGH'}
          onClick={() => toggleVariability('HIGH')}
        />
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Autocomplete
              freeSolo
              options={nameSuggestions}
              inputValue={nameInput}
              onInputChange={(_event, newValue) => setNameInput(newValue)}
              sx={{ flex: 1, maxWidth: 360 }}
              renderInput={(inputParams) => (
                <TextField
                  {...inputParams}
                  label="Resurs adı ilə axtarış"
                  placeholder="Məs: Armatur"
                  slotProps={{
                    ...inputParams.slotProps,
                    input: {
                      ...inputParams.slotProps.input,
                      startAdornment: <SearchRoundedIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              )}
            />
            <Box sx={{ minWidth: 260 }}>
              <CategoryTreeFilterPicker
                value={params.categoryId ?? null}
                onChange={(id) => updateParams({ categoryId: id ?? undefined })}
              />
            </Box>
            <TextField
              select
              label="Region"
              value={params.regionId ?? ''}
              onChange={(event) => updateParams({ regionId: event.target.value || undefined })}
              disabled={regionsQuery.isLoading}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Bütün regionlar</MenuItem>
              {(regionsQuery.data?.content ?? []).map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {averagesQuery.isError && <Alert severity="error">{getApiErrorMessage(averagesQuery.error)}</Alert>}

      {!averagesQuery.isError && (
        <Card>
          <DataGrid
            autoHeight
            rows={rows}
            rowCount={totalElements}
            getRowId={(row) => `${row.productId}:${row.regionId}`}
            loading={averagesQuery.isFetching}
            columns={columns}
            paginationMode="server"
            sortingMode="server"
            sortingOrder={['asc', 'desc']}
            paginationModel={{ page: params.page, pageSize: params.size }}
            onPaginationModelChange={(model) => updateParams({ page: model.page, size: model.pageSize })}
            sortModel={sortModel}
            onSortModelChange={(model) => {
              if (model.length === 0) {
                return;
              }
              setSortField(model[0].field);
              setSortDirection(model[0].sort ?? 'asc');
            }}
            pageSizeOptions={[10, 25, 50]}
            getRowHeight={() => 56}
            disableRowSelectionOnClick
            localeText={{ ...azGridLocaleText, noRowsLabel: 'Uyğun bazar statistikası tapılmadı.' }}
          />
        </Card>
      )}

      <MarketAverageDetailDialog row={detailTarget} onClose={() => setDetailTarget(null)} />
    </PageContainer>
  );
}
