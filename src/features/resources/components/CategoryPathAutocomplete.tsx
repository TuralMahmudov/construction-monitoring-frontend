import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material/styles';
import { useCategoryOptions } from '../hooks/useCategoryOptions';
import type { FlatCategoryOption } from '../utils/flattenCategoryPaths';

export interface CategoryPathAutocompleteProps {
  value: string | null;
  onChange: (id: string | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function CategoryPathAutocomplete({
  value,
  onChange,
  error,
  helperText,
  disabled,
  sx,
}: CategoryPathAutocompleteProps) {
  // Every current caller (product filter, resource/product creation) assigns
  // or searches by a category a product actually lives in — always a leaf.
  const { options, isLoading } = useCategoryOptions(true);
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
      sx={sx}
      renderInput={(params) => (
        <TextField {...params} label="Kateqoriya" error={error} helperText={helperText} />
      )}
    />
  );
}
