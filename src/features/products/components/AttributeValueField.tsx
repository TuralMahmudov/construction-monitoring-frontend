import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
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
  enumValues,
  required,
  disabled,
  error,
  helperText,
}: AttributeValueFieldProps) {
  const displayLabel = required ? `${label} *` : label;

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

  const isNumber = dataType === ATTRIBUTE_DATA_TYPE.NUMBER;

  return (
    <TextField
      type={isNumber ? 'number' : 'text'}
      label={displayLabel}
      fullWidth
      value={value}
      onChange={(event) => {
        const raw = event.target.value;
        // Attribute numbers (diameter, weight, etc.) are physical
        // measurements — negative values are never valid. Stripping the
        // sign (rather than ignoring the event) keeps the controlled value
        // in sync with the DOM; ignoring it desyncs them and leaves the
        // field stuck showing whatever the browser typed natively.
        onChange(isNumber ? raw.replace(/-/g, '') : raw);
      }}
      onWheel={
        isNumber
          ? (event) => {
              // Focused number inputs hijack page-scroll wheel events to
              // bump the value. Blurring on wheel lets the scroll pass
              // through to the page instead.
              (event.target as HTMLElement).blur();
            }
          : undefined
      }
      disabled={disabled}
      error={error}
      helperText={helperText ?? (unit ? `Vahid: ${unit}` : undefined)}
      slotProps={{
        input: unit ? { endAdornment: <span>{unit}</span> } : undefined,
        htmlInput: isNumber ? { min: 0 } : undefined,
      }}
    />
  );
}
