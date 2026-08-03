import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { usePriceAverages } from '../../../admin/market-averages/hooks/usePriceAverages';
import { PriceRangeBar } from '../../../admin/market-averages/components/PriceRangeBar';
import { VariabilityChip } from '../../../admin/market-averages/components/VariabilityChip';
import { computeVariability } from '../../../admin/market-averages/utils/priceVariability';
import { useAllRegions } from '../../../reference-data/hooks/useReferenceOptions';
import { getApiErrorMessage } from '../../../../shared/lib/apiErrorMessage';
import type { Resource } from '../../types/resource.types';

export interface ResourceMarketAveragesTabProps {
  resource: Resource;
}

export function ResourceMarketAveragesTab({ resource }: ResourceMarketAveragesTabProps) {
  const regionsQuery = useAllRegions();
  // § 8 — resource.productId is NOT NULL, no "theoretical null" case anymore.
  const averagesQuery = usePriceAverages({ productId: resource.productId, size: 50 });

  if (averagesQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (averagesQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(averagesQuery.error)}</Alert>;
  }

  const rows = averagesQuery.data?.content ?? [];
  const regionNames = new Map((regionsQuery.data?.content ?? []).map((region) => [region.id, region.name]));

  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Bu bazar qrupu üçün hələ heç bir təsdiqlənmiş qiymət statistikası yoxdur.
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Region</TableCell>
            <TableCell align="right">Median</TableCell>
            <TableCell>Qiymət aralığı</TableCell>
            <TableCell>Dəyişkənlik</TableCell>
            <TableCell align="right">Nümunə sayı</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.regionId} hover>
              <TableCell>{regionNames.get(row.regionId) ?? '—'}</TableCell>
              <TableCell align="right">{row.medianPrice.toFixed(2)}</TableCell>
              <TableCell>
                <PriceRangeBar min={row.minPrice} max={row.maxPrice} median={row.medianPrice} />
              </TableCell>
              <TableCell>
                <VariabilityChip variability={computeVariability(row.minPrice, row.maxPrice, row.medianPrice)} />
              </TableCell>
              <TableCell align="right">{row.sampleCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
