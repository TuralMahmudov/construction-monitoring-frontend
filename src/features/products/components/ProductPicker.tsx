import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product.types';

export interface ProductPickerProps {
  categoryId: string | null;
  value: Product | null;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// § 6.1 "Mövcud məhsul seç" — lists products already registered under the
// chosen leaf category so the user can attach a new listing to one instead
// of creating a duplicate.
export function ProductPicker({ categoryId, value, onChange, disabled, error, helperText }: ProductPickerProps) {
  const productsQuery = useProducts(
    { category: categoryId ?? undefined, active: true, size: 100, sort: 'name' },
    { enabled: Boolean(categoryId) },
  );
  const options = productsQuery.data?.content ?? [];

  return (
    <Autocomplete<Product>
      options={options}
      getOptionLabel={(option) => `${option.code} — ${option.name}`}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      value={value}
      onChange={(_event, newValue) => onChange(newValue)}
      loading={productsQuery.isFetching}
      loadingText="Yüklənir..."
      noOptionsText={categoryId ? 'Bu kateqoriyada məhsul tapılmadı' : 'Əvvəlcə kateqoriya seçin'}
      disabled={disabled || !categoryId}
      renderInput={(params) => (
        <TextField {...params} label="Məhsul" error={error} helperText={helperText} />
      )}
    />
  );
}
