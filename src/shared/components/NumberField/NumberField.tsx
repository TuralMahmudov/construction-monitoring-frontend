import TextField, { type TextFieldProps } from '@mui/material/TextField';

export interface NumberFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
}

// A plain `<TextField type="number" value={0}>` shows "0" in the DOM, and
// since the cursor lands after that digit on focus, typing "1" then "5"
// appends onto it ("015") instead of replacing it — the field only self-
// corrects once the user notices and deletes the leading zero by hand.
// Displaying an empty string whenever the underlying value is exactly 0
// sidesteps this entirely: there's nothing to type "after", so the first
// keystroke starts the number cleanly. Empty input maps back to 0 on change,
// so the numeric contract (never null/undefined) is unchanged for callers.
export function NumberField({ value, onChange, ...rest }: NumberFieldProps) {
  return (
    <TextField
      {...rest}
      type="number"
      value={value === 0 ? '' : value}
      onChange={(event) => {
        // Every current use (price, VAT, decimal precision, sort order) is
        // non-negative, so the sign is stripped as typed. Stripping (rather
        // than ignoring the keystroke) keeps the controlled value in sync
        // with the DOM instead of leaving it stuck on a stale value.
        const raw = event.target.value.replace(/-/g, '');
        onChange(raw === '' ? 0 : Number(raw));
      }}
      onWheel={(event) => {
        // Focused number inputs hijack page-scroll wheel events to bump the
        // value. Blurring on wheel lets the scroll pass through to the page
        // instead, so the value only ever changes from typed input.
        (event.target as HTMLElement).blur();
      }}
      slotProps={{ ...rest.slotProps, htmlInput: { min: 0, ...rest.slotProps?.htmlInput } }}
    />
  );
}
