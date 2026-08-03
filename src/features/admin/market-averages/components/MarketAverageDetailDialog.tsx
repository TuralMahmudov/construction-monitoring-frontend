import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import type { ResourcePriceAverageResponse } from '../types/priceAverage.types';
import { computeVariability } from '../utils/priceVariability';
import { ignoreBackdropClose } from '../../../../shared/lib/ignoreBackdropClose';
import { PriceRangeBar } from './PriceRangeBar';
import { VariabilityChip } from './VariabilityChip';

export interface MarketAverageDetailDialogProps {
  row: ResourcePriceAverageResponse | null;
  regionName: string;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Grid>
  );
}

export function MarketAverageDetailDialog({ row, regionName, onClose }: MarketAverageDetailDialogProps) {
  if (!row) {
    return null;
  }

  const variability = computeVariability(row.minPrice, row.maxPrice, row.medianPrice);

  return (
    <Dialog open onClose={ignoreBackdropClose(onClose)} maxWidth="sm" fullWidth>
      <DialogTitle>{row.resourceName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Field label="Region" value={regionName} />
          </Grid>

          <Divider />

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {row.medianPrice.toFixed(2)}
            </Typography>
            <VariabilityChip variability={variability} />
          </Stack>

          <PriceRangeBar min={row.minPrice} max={row.maxPrice} median={row.medianPrice} />

          <Divider />

          <Grid container spacing={2}>
            <Field label="Nümunə sayı" value={String(row.sampleCount)} />
            <Field label="Son hesablanma" value={dayjs(row.calculatedAt).format('DD.MM.YYYY HH:mm')} />
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Bağla</Button>
      </DialogActions>
    </Dialog>
  );
}
