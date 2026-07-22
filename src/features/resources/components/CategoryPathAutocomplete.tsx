import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useCategoryOptions } from '../hooks/useCategoryOptions';
import type { FlatCategoryOption } from '../utils/flattenCategoryPaths';

export interface CategoryPathAutocompleteProps {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export function CategoryPathAutocomplete({
  value,
  onChange,
  error,
  helperText,
  disabled,
}: CategoryPathAutocompleteProps) {
  const { options, isLoading } = useCategoryOptions();
  const selected = options.find((option) => option.id === value) ?? null;

  return (
    <Autocomplete<FlatCategoryOption>
      options={options}
      getOptionLabel={(option) => option.path}
      isOptionEqualToValue={(option, selectedValue) => option.id === selectedValue.id}
      value={selected}
      onChange={(_event, newValue) => onChange(newValue?.id ?? null)}
      loading={isLoading}
      loadingText="Yüklənir..."
      noOptionsText="Kateqoriya tapılmadı"
      disabled={disabled}
      renderInput={(params) => (
        <TextField {...params} label="Kateqoriya" error={error} helperText={helperText} />
      )}
    />
  );
}
