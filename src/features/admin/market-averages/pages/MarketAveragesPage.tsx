import { useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { isCentralAdmin } from '../../../../shared/lib/permissions';
import { useDebouncedValue } from '../../../resources/hooks/useDebouncedValue';
import { useProductLookup } from '../../../products/hooks/useProductLookup';
import { useAllRegions } from '../../../reference-data/hooks/useReferenceOptions';
import { usePriceAverages } from '../hooks/usePriceAverages';
import type { ResourcePriceAverageResponse } from '../types/priceAverage.types';
import { computeVariability } from '../utils/priceVariability';
import { MarketAverageDetailDialog } from '../components/MarketAverageDetailDialog';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { StatTile } from '../components/StatTile';
import { VariabilityChip } from '../components/VariabilityChip';

const PAGE_SIZE = 25;

export function MarketAveragesPage() {
  const { user } = useAuth();
  const canAccess = isCentralAdmin(user?.roles ?? []);
  const [nameInput, setNameInput] = useState('');
  const debouncedName = useDebouncedValue(nameInput, 300);
  const [regionId, setRegionId] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: PAGE_SIZE });
  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [detailTarget, setDetailTarget] = useState<ResourcePriceAverageResponse | null>(null);
  // Memoized so the array reference only changes when the sort actually
  // does — DataGrid treats a new `sortModel` reference as an external sort
  // change and resets pagination to page 0 on every unrelated re-render
  // otherwise (bax useGridPaginationModel's `sortModelChange` listener).
  const sortModel = useMemo(
    () => (sortField ? [{ field: sortField, sort: sortDirection }] : []),
    [sortField, sortDirection],
  );

  const regionsQuery = useAllRegions(canAccess);
  const regionNames = useMemo(() => {
    const map = new Map<string, string>();
    (regionsQuery.data?.content ?? []).forEach((region) => map.set(region.id, region.name));
    return map;
  }, [regionsQuery.data]);

  const averagesQuery = usePriceAverages(
    {
      name: debouncedName || undefined,
      regionId: regionId || undefined,
      page: paginationModel.page,
      size: paginationModel.pageSize,
      sort: sortField ? `${sortField},${sortDirection}` : undefined,
    },
    { enabled: canAccess },
  );

  const rows = useMemo(() => averagesQuery.data?.content ?? [], [averagesQuery.data]);
  // description (kateqoriya + atribut xülasəsi) bu aggregate cavabında
  // yoxdur (yalnız bare `resourceName`), productId isə var — productId
  // üzrə ayrıca lookup ilə tapılır (bax useProductLookup).
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

  // Global (totalElements) for the filtered count, but the variability
  // breakdown can only reflect what's actually loaded on this page — there's
  // no backend aggregate for it, so the tiles say so explicitly.
  const stats = useMemo(() => {
    let stable = 0;
    let moderate = 0;
    let high = 0;
    rows.forEach((row) => {
      const level = computeVariability(row.minPrice, row.maxPrice, row.medianPrice).level;
      if (level === 'stable') stable += 1;
      else if (level === 'moderate') moderate += 1;
      else high += 1;
    });
    return { stable, moderate, high };
  }, [rows]);

  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  const columns: GridColDef<ResourcePriceAverageResponse>[] = [
    {
      field: 'resourceName',
      headerName: 'Resurs',
      flex: 1,
      minWidth: 180,
      sortable: false,
      valueGetter: (_v, row) => productLookup.get(row.productId)?.description || row.resourceName,
    },
    {
      field: 'regionId',
      headerName: 'Region',
      width: 120,
      sortable: false,
      valueGetter: (_v, row) => regionNames.get(row.regionId) ?? '—',
    },
    {
      field: 'medianPrice',
      headerName: 'Median',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_v, row) => row.medianPrice.toFixed(2),
    },
    {
      field: 'range',
      headerName: 'Qiymət aralığı',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <PriceRangeBar min={params.row.minPrice} max={params.row.maxPrice} median={params.row.medianPrice} />
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
    { field: 'sampleCount', headerName: 'Nümunə', width: 90, align: 'right', headerAlign: 'right' },
    {
      field: 'calculatedAt',
      headerName: 'Son hesablanma',
      width: 150,
      valueGetter: (_v, row) => dayjs(row.calculatedAt).format('DD.MM.YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Əməliyyatlar',
      width: 90,
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
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <StatTile label="Cəmi qrup (filtrə uyğun)" value={averagesQuery.data?.totalElements ?? 0} />
        <StatTile label="Stabil (bu səhifədə)" value={stats.stable} color="success.main" />
        <StatTile label="Orta dəyişkənlik (bu səhifədə)" value={stats.moderate} color="warning.main" />
        <StatTile label="Yüksək dəyişkənlik (bu səhifədə)" value={stats.high} color="error.main" />
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
              freeSolo
              options={nameSuggestions}
              inputValue={nameInput}
              onInputChange={(_event, newValue) => setNameInput(newValue)}
              sx={{ flex: 1, maxWidth: 360 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Resurs adı ilə axtarış"
                  placeholder="Məs: Armatur"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...params.slotProps.input,
                      startAdornment: <SearchRoundedIcon color="action" sx={{ mr: 1 }} />,
                    },
                  }}
                />
              )}
            />
            <TextField
              select
              label="Region"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
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
            rowCount={averagesQuery.data?.totalElements ?? 0}
            getRowId={(row) => `${row.productId}:${row.regionId}`}
            loading={averagesQuery.isFetching}
            columns={columns}
            paginationMode="server"
            sortingMode="server"
            sortingOrder={['asc', 'desc']}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
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
            localeText={{ noRowsLabel: 'Uyğun bazar statistikası tapılmadı.' }}
          />
        </Card>
      )}

      <MarketAverageDetailDialog
        row={detailTarget}
        regionName={detailTarget ? (regionNames.get(detailTarget.regionId) ?? '—') : ''}
        onClose={() => setDetailTarget(null)}
      />
    </PageContainer>
  );
}
