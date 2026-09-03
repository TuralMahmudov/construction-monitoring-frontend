import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { useCategoryNameLookup, useUnitLookup } from '../../resources/hooks/useLookups';
import { useMyResource } from '../hooks/useMyResource';
import { MyResourceAttributesReadOnly } from './MyResourceAttributesReadOnly';
import { MyResourcePricesList } from './MyResourcePricesList';
import { StatusChip } from './StatusChip';

export interface MyResourceViewDialogProps {
  open: boolean;
  resourceId: string | null;
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

export function MyResourceViewDialog({ open, resourceId, onClose }: MyResourceViewDialogProps) {
  const resourceQuery = useMyResource(open ? resourceId : null);
  const categoryNames = useCategoryNameLookup();
  const unitSymbols = useUnitLookup();
  const resource = resourceQuery.data;

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="md" fullWidth>
      <DialogTitle>Resursa bax</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {resourceQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {resourceQuery.isError && <Alert severity="error">{getApiErrorMessage(resourceQuery.error)}</Alert>}

          {resource && (
            <>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Əsas Məlumatlar
                    </Typography>
                    <StatusChip status={resource.status} label={resource.statusLabel} />
                  </Stack>
                  <Grid container spacing={2}>
                    <Field label="Kod" value={resource.code} />
                    <Field label="Kateqoriya" value={categoryNames.get(resource.categoryId) ?? '—'} />
                    <Field label="Ad" value={resource.name} />
                    <Field label="Vahid" value={unitSymbols.get(resource.unitId) ?? '—'} />
                    <Field label="İstehsalçı" value={resource.manufacturer} />
                    <Field label="Model" value={resource.model ?? ''} />
                    <Field label="Yaradılma tarixi" value={dayjs(resource.createdDate).format('DD.MM.YYYY')} />
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Təsvir
                      </Typography>
                      <Typography variant="body2">{resource.description || '—'}</Typography>
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Spesifikasiya
                      </Typography>
                      <Typography variant="body2">{resource.specification || '—'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <MyResourceAttributesReadOnly productId={resource.productId} />

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Qiymətlər
                  </Typography>
                  <MyResourcePricesList prices={resource.prices} />
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Bağla</Button>
      </DialogActions>
    </Dialog>
  );
}
