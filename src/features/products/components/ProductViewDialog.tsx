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
import { useProduct } from '../hooks/useProduct';
import { ProductAttributesReadOnly } from './ProductAttributesReadOnly';
import { ProductGeneralTab } from './ProductGeneralTab';
import { ProductListingsTab } from './ProductListingsTab';

export interface ProductViewDialogProps {
  open: boolean;
  productId: string | null;
  onClose: () => void;
}

// 2026-08-05 — replaces the old tabbed /products/:id page (Tural: side-by-side
// tabs "yorur"). Same single-scroll-dialog pattern as MyResourceViewDialog:
// one Dialog, sections stacked as Cards instead of switched via Tabs.
export function ProductViewDialog({ open, productId, onClose }: ProductViewDialogProps) {
  const productQuery = useProduct(open ? productId : null);
  const product = productQuery.data;

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(onClose)} maxWidth="lg" fullWidth>
      <DialogTitle>Məhsula bax</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {productQuery.isLoading && (
            <Stack sx={{ alignItems: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Stack>
          )}

          {productQuery.isError && <Alert severity="error">{getApiErrorMessage(productQuery.error)}</Alert>}

          {product && (
            <>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <ProductGeneralTab product={product} />
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Xüsusiyyətlər
                  </Typography>
                  <ProductAttributesReadOnly productId={product.id} />
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Elanlar
                  </Typography>
                  <ProductListingsTab productId={product.id} />
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
