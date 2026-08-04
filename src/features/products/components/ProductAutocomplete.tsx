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

function labelFor(product: Product): string {
  return `${product.code} — ${product.name}`;
}

// Global (not category-scoped) product typeahead by name/code — used to
// filter the Resurslar/Elanlar list by `?product={id}` (§ 3.4), unlike
// ProductPicker which lists a bounded set under one category (§ 6.1).
//
// `inputValue` is set ONLY from these two handlers below, never derived from
// `value` via a render-time expression or an effect keyed on it — an earlier
// version did `value ? label : inputValue` inline, which re-pinned the
// displayed text back to the selected label on every render once anything
// had ever been selected (typing felt completely broken). A later attempt
// synced via `useEffect(() => setInputValue(...), [value])`, but that raced
// with `onInputChange`'s own `onChange(null)` call — the effect would fire
// on the next render and wipe the character just typed, eating the first
// keystroke after any selection. Setting inputValue directly, and only
// here, avoids both.
export function ProductAutocomplete({ value, onChange, disabled }: ProductAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value ? labelFor(value) : '');
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
      getOptionLabel={labelFor}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newValue, reason) => {
        setInputValue(newValue);
        // User is typing away from the previously selected product — drop
        // the stale selection so the applied filter matches what's shown.
        if (reason === 'input' && value) {
          onChange(null);
        }
      }}
      onChange={(_event, newValue) => {
        onChange(newValue);
        setInputValue(newValue ? labelFor(newValue) : '');
      }}
      loading={productsQuery.isFetching}
      loadingText="Yüklənir..."
      noOptionsText={debouncedInput ? 'Nəticə tapılmadı' : 'Axtarmaq üçün yazın'}
      disabled={disabled}
      renderInput={(params) => <TextField {...params} label="Məhsul (kod/ad)" size="small" />}
    />
  );
}
