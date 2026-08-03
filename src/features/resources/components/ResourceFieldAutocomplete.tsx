import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export interface ResourceFieldAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

// freeSolo: existing values (Bosch, Norm, ...) can be picked from the list,
// but a brand-new value can also be typed and saved — the backend has no
// separate "create manufacturer" endpoint, a new resource referencing an
// unseen value is all it takes (bax PROJECT_STATUS.md bölmə 4q).
export function ResourceFieldAutocomplete({
  label,
  value,
  onChange,
  options,
  loading,
  error,
  helperText,
  disabled,
}: ResourceFieldAutocompleteProps) {
  return (
    <Autocomplete
      freeSolo
      fullWidth
      options={options}
      value={value}
      inputValue={value}
      loading={loading}
      loadingText="Yüklənir..."
      noOptionsText="Nəticə yoxdur"
      disabled={disabled}
      onInputChange={(_event, newInputValue) => onChange(newInputValue)}
      onChange={(_event, newValue) => onChange(newValue ?? '')}
      renderInput={(params) => (
        <TextField {...params} label={label} error={error} helperText={helperText} />
      )}
    />
  );
}
