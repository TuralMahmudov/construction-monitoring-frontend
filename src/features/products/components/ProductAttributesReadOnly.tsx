import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useProductAttributes } from '../hooks/useProductAttributes';

export interface ProductAttributesReadOnlyProps {
  productId: string;
}

// § 6.1 step 2 — once an existing product is picked, its attributes are
// shown read-only; changing them means a different product, not an edit.
export function ProductAttributesReadOnly({ productId }: ProductAttributesReadOnlyProps) {
  const attributesQuery = useProductAttributes(productId);

  if (attributesQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 1 }}>
        <CircularProgress size={22} />
      </Stack>
    );
  }

  const attributes = attributesQuery.data ?? [];
  if (attributes.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Bu məhsul üçün xüsusiyyət qeyd edilməyib.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {attributes.map((attribute) => (
        <Stack key={attribute.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {attribute.attributeName}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
            {attribute.value}
            {attribute.unitSymbol ? ` ${attribute.unitSymbol}` : ''}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
