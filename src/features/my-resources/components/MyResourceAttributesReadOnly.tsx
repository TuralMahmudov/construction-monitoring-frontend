import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import { useProductAttributes } from '../../products/hooks/useProductAttributes';

export interface MyResourceAttributesReadOnlyProps {
  productId: string;
}

// § 4 — the old GET /api/resources/{id}/attributes was removed with the
// product split; this module's resources are still plain resources under
// the hood, so their attributes now read through the product they resolved
// to (GET /api/products/{productId}/attributes).
export function MyResourceAttributesReadOnly({ productId }: MyResourceAttributesReadOnlyProps) {
  const attributesQuery = useProductAttributes(productId);
  const attributes = attributesQuery.data ?? [];

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Xüsusiyyətlər
        </Typography>

        {attributesQuery.isLoading && (
          <Stack sx={{ alignItems: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Stack>
        )}

        {attributesQuery.isError && <Alert severity="error">{getApiErrorMessage(attributesQuery.error)}</Alert>}

        {!attributesQuery.isLoading && !attributesQuery.isError && attributes.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            Xüsusiyyət yoxdur.
          </Typography>
        )}

        <Grid container spacing={2}>
          {attributes.map((attribute) => (
            <Grid key={attribute.id} size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {attribute.attributeName}
              </Typography>
              <Typography variant="body2">
                {attribute.value}
                {attribute.unitSymbol ? ` ${attribute.unitSymbol}` : ''}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
