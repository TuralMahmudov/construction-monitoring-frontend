import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useDebouncedValue } from '../../resources/hooks/useDebouncedValue';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product.types';

export interface ProductAutocompleteProps {
  value: Product | null;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
}

// Global (not category-scoped) product typeahead by name/code — used to
// filter the Resurslar/Elanlar list by `?product={id}` (§ 3.4), unlike
// ProductPicker which lists a bounded set under one category (§ 6.1).
export function ProductAutocomplete({ value, onChange, disabled }: ProductAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebouncedValue(inputValue, 300);
  const productsQuery = useProducts(
    { name: debouncedInput || undefined, size: 20, sort: 'name' },
    { enabled: debouncedInput.trim().length > 0 },
  );
  const options = productsQuery.data?.content ?? [];

  return (
    <Autocomplete<Product>
      options={options}
      filterOptions={(opts) => opts}
      getOptionLabel={(option) => `${option.code} — ${option.name}`}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      value={value}
      inputValue={value ? `${value.code} — ${value.name}` : inputValue}
      onInputChange={(_event, newValue) => setInputValue(newValue)}
      onChange={(_event, newValue) => onChange(newValue)}
      loading={productsQuery.isFetching}
      loadingText="Yüklənir..."
      noOptionsText={debouncedInput ? 'Nəticə tapılmadı' : 'Axtarmaq üçün yazın'}
      disabled={disabled}
      renderInput={(params) => <TextField {...params} label="Məhsul (kod/ad)" size="small" />}
    />
  );
}
