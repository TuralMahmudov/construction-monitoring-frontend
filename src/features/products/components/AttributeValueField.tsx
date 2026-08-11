import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { NumberField } from '../../../shared/components';
import { useAllUnits } from '../../reference-data/hooks/useReferenceOptions';
import {
  ATTRIBUTE_DATA_TYPE,
  type AttributeDataType,
  type AttributeEnumValue,
} from '../../admin/attribute-definitions/types/attributeDefinition.types';

export interface AttributeValueFieldProps {
  dataType: AttributeDataType;
  value: string;
  onChange: (value: string) => void;
  label: string;
  unit?: string | null;
  /** Resolves to the unit's own `decimalPrecision` (bax reference-data
   *  Vahidlər) so NUMBER inputs cap decimals to what the unit actually
   *  supports — e.g. "ədəd" (0 decimals) vs "metr" (2 decimals). */
  defaultUnitId?: string | null;
  enumValues?: AttributeEnumValue[];
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// Renders the right control for a single attribute value given its data
// type — shared between the product-creation screen's inline attribute
// section and any read-only attribute display, so the NUMBER/ENUM/BOOLEAN/
// DATE/TEXT switch only lives in one place.
export function AttributeValueField({
  dataType,
  value,
  onChange,
  label,
  unit,
  defaultUnitId,
  enumValues,
  required,
  disabled,
  error,
  helperText,
}: AttributeValueFieldProps) {
  const displayLabel = required ? `${label} *` : label;
  const allUnitsQuery = useAllUnits();
  const unitDecimals = defaultUnitId
    ? allUnitsQuery.data?.content.find((u) => u.id === defaultUnitId)?.decimalPrecision
    : undefined;

  if (dataType === ATTRIBUTE_DATA_TYPE.BOOLEAN) {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={value === 'true'}
            onChange={(event) => onChange(event.target.checked ? 'true' : 'false')}
            disabled={disabled}
          />
        }
        label={displayLabel}
      />
    );
  }

  if (dataType === ATTRIBUTE_DATA_TYPE.ENUM) {
    return (
      <TextField
        select
        label={displayLabel}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        error={error}
        helperText={helperText}
      >
        {(enumValues ?? [])
          .filter((enumValue) => enumValue.active)
          .map((enumValue) => (
            <MenuItem key={enumValue.id} value={enumValue.value}>
              {enumValue.value}
            </MenuItem>
          ))}
      </TextField>
    );
  }

  if (dataType === ATTRIBUTE_DATA_TYPE.DATE) {
    return (
      <TextField
        type="date"
        label={displayLabel}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        disabled={disabled}
        error={error}
        helperText={helperText}
      />
    );
  }

  if (dataType === ATTRIBUTE_DATA_TYPE.NUMBER) {
    return (
      <NumberField
        label={displayLabel}
        fullWidth
        value={value === '' ? 0 : Number(value)}
        onChange={(num) => onChange(num === 0 ? '' : String(num))}
        decimals={unitDecimals ?? undefined}
        disabled={disabled}
        error={error}
        helperText={helperText ?? (unit ? `Vahid: ${unit}` : undefined)}
        slotProps={{
          input: unit ? { endAdornment: <span>{unit}</span> } : undefined,
        }}
      />
    );
  }

  return (
    <TextField
      label={displayLabel}
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      error={error}
      helperText={helperText ?? (unit ? `Vahid: ${unit}` : undefined)}
      slotProps={{
        input: unit ? { endAdornment: <span>{unit}</span> } : undefined,
      }}
    />
  );
}
