import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import { ResourceMarketAveragesTab } from '../prices/components/ResourceMarketAveragesTab';
import { ResourcePricesTab } from '../prices/components/ResourcePricesTab';
import { useResource } from '../hooks/useResource';
import { ResourceGeneralTab } from './ResourceGeneralTab';

export interface ResourceViewDialogProps {
  open: boolean;
  resourceId: string | null;
  onClose: () => void;
}

// 2026-08-05 — replaces the old tabbed /resources/:id page (Tural: side-by-side
// tabs "yorur"). Same single-scroll-dialog pattern as MyResourceViewDialog:
// one Dialog, sections stacked as Cards instead of switched via Tabs.
export function ResourceViewDialog({ open, resourceId, onClose }: ResourceViewDialogProps) {
  const resourceQuery = useResource(open ? resourceId : null);
  const resource = resourceQuery.data;

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="lg" fullWidth>
      <DialogTitle>Elana bax</DialogTitle>
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
                  <ResourceGeneralTab resource={resource} />
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Qiymətlər
                  </Typography>
                  <ResourcePricesTab resourceId={resource.id} organizationId={resource.organizationId} />
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Bazar Qiyməti
                  </Typography>
                  <ResourceMarketAveragesTab resource={resource} />
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
