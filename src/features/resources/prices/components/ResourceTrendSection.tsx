import { useMemo, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useColorMode } from '../../../../hooks/useColorMode';
import { useAllRegions } from '../../../reference-data/hooks/useReferenceOptions';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import { formatPeriod } from '../../../../shared/lib/period';
import { usePeriodAverages } from '../hooks/usePeriodAverages';
import { formatSampleCount } from '../../../admin/market-averages/utils/formatSampleCount';

// Palette skill reference (categorical slot 1) — single series (Median only,
// bax aşağı: `avgPrice` kənar dəyərlərdən təsirləndiyi üçün canlı Bazar
// Qiyməti tab-ında da göstərilmir (əvvəlki istifadəçi qərarı), Qiymət
// Dinamikası da eyni prinsipə tabe olur).
const MEDIAN_COLOR = { light: '#2a78d6', dark: '#3987e5' };

export interface ResourceTrendSectionProps {
  productId: string;
}

export function ResourceTrendSection({ productId }: ResourceTrendSectionProps) {
  const { mode } = useColorMode();
  const regionsQuery = useAllRegions();
  const [regionId, setRegionId] = useState<string | null>(null);
  const trendQuery = usePeriodAverages({ productId, size: 50 });

  const regions = regionsQuery.data?.content ?? [];
  const regionNames = new Map(regions.map((region) => [region.id, region.name]));

  const trendData = trendQuery.data;
  const allRows = useMemo(() => trendData?.content ?? [], [trendData]);

  // Default to the first region present once data lands, so the chart isn't
  // blank on first render — a trend line mixing several regions at the same
  // quarter would be meaningless, so a single region must always be selected.
  const effectiveRegionId = regionId ?? allRows[0]?.regionId ?? null;

  const rows = useMemo(
    () =>
      allRows
        .filter((row) => row.regionId === effectiveRegionId)
        .sort((a, b) => a.periodYear - b.periodYear || a.periodQuarter - b.periodQuarter),
    [allRows, effectiveRegionId],
  );

  if (trendQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (trendQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(trendQuery.error)}</Alert>;
  }

  if (allRows.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Bu məhsul üçün hələ tarixi məlumat yoxdur.
      </Typography>
    );
  }

  const availableRegions = Array.from(new Set(allRows.map((row) => row.regionId))).map((id) => ({
    id,
    name: regionNames.get(id) ?? id,
  }));

  return (
    <Stack spacing={2}>
      <Autocomplete
        options={availableRegions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        value={availableRegions.find((r) => r.id === effectiveRegionId) ?? null}
        onChange={(_event, newValue) => setRegionId(newValue?.id ?? null)}
        sx={{ maxWidth: 280 }}
        renderInput={(inputParams) => <TextField {...inputParams} label="Region" size="small" />}
      />

      {rows.length > 0 && (
        <LineChart
          height={280}
          xAxis={[{ data: rows.map((row) => formatPeriod(row.periodYear, row.periodQuarter)), scaleType: 'point' }]}
          series={[
            {
              label: 'Median',
              data: rows.map((row) => row.medianPrice),
              color: mode === 'dark' ? MEDIAN_COLOR.dark : MEDIAN_COLOR.light,
              showMark: true,
            },
          ]}
          // Tək seriya — legend lazımsızdır, başlıq ("Qiymət Dinamikası") artıq
          // nə olduğunu göstərir.
          hideLegend
          margin={{ left: 60 }}
        />
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rüb</TableCell>
              <TableCell align="right">Median</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Max</TableCell>
              <TableCell align="right">Nümunə</TableCell>
              <TableCell align="right">Əvvəlki dövrlə fərq</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.periodYear}-${row.periodQuarter}`} hover>
                <TableCell>{formatPeriod(row.periodYear, row.periodQuarter)}</TableCell>
                <TableCell align="right">{row.medianPrice.toFixed(2)}</TableCell>
                <TableCell align="right">{row.minPrice.toFixed(2)}</TableCell>
                <TableCell align="right">{row.maxPrice.toFixed(2)}</TableCell>
                <TableCell align="right">{formatSampleCount(row.sampleCount, row.resourceCount)}</TableCell>
                <TableCell align="right">
                  {row.periodOverPeriodChangePct === null || Number.isNaN(Number(row.periodOverPeriodChangePct)) ? (
                    // Backend məlum halda (yalnız bir dövr məlumatı olanda,
                    // əvvəlki rüb yoxdursa) `null` yerinə `NaN` (bəzən string
                    // "NaN" kimi serializə olunur) qaytarır — canlı yoxlamada
                    // tapıldı (2026-08-17). Hər iki halı eyni "—" kimi
                    // göstəririk, backend-i düzəltmək gözlənilmədən.
                    '—'
                  ) : (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        color: row.periodOverPeriodChangePct >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {row.periodOverPeriodChangePct >= 0 ? (
                        <ArrowUpwardRoundedIcon fontSize="inherit" />
                      ) : (
                        <ArrowDownwardRoundedIcon fontSize="inherit" />
                      )}
                      <span>{Math.abs(row.periodOverPeriodChangePct).toFixed(2)}%</span>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
