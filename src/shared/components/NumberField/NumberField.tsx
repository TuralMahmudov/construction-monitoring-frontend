import { useEffect, useState } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export interface NumberFieldProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  /** Caps how many digits may be typed after the decimal point and sets the
   *  native step accordingly (e.g. a unit's `decimalPrecision`). Unlimited
   *  when omitted. */
  decimals?: number;
}

function displayText(value: number): string {
  return value === 0 ? '' : String(value);
}

// Plain text (not type="number") on purpose — a native number input silently
// reports its `.value` as "" for any input the browser doesn't yet consider a
// complete number (e.g. "0." or, in some browsers, "0.5" while the leading
// zero was typed on a previous keystroke). Controlled against that sanitized
// empty string, a value like "0.5" could never be typed: the "0" keystroke
// commits value=0 (displayed as "" per the rule below), then "." reports back
// "" again and gets discarded, leaving only "5" once that's typed. Filtering
// the raw keystrokes ourselves sidesteps the browser's sanitization entirely.
export function NumberField({ value, onChange, decimals, ...rest }: NumberFieldProps) {
  // A plain `<TextField value={0}>` shows "0" in the DOM, and since the
  // cursor lands after that digit on focus, typing "1" then "5" appends onto
  // it ("015") instead of replacing it — the field only self-corrects once
  // the user notices and deletes the leading zero by hand. Displaying an
  // empty string whenever the value is exactly 0 sidesteps this: there's
  // nothing to type "after", so the first keystroke starts the number
  // cleanly. Empty input maps back to 0 on change, so the numeric contract
  // (never null/undefined) is unchanged for callers.
  const [text, setText] = useState(() => displayText(value));
  const [focused, setFocused] = useState(false);

  // Only resync from the external value while the field isn't focused —
  // otherwise every keystroke's onChange (value goes up, then comes back down
  // through this same prop) would immediately overwrite what's mid-typing,
  // e.g. collapsing "0." back to "" before a trailing digit can be added.
  useEffect(() => {
    if (!focused) {
      setText(displayText(value));
    }
  }, [value, focused]);

  return (
    <TextField
      {...rest}
      type="text"
      value={text}
      onFocus={(event) => {
        setFocused(true);
        rest.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        setText(displayText(value));
        rest.onBlur?.(event);
      }}
      onChange={(event) => {
        // Keep only digits and a single decimal point — everything else
        // (letters, extra dots, the sign) is dropped as typed. Every current
        // use (price, VAT, decimal precision, sort order, attribute values)
        // is non-negative, so "-" is stripped rather than rejecting the
        // keystroke, which keeps the field in sync with what's on screen.
        let raw = event.target.value.replace(/[^0-9.]/g, '');
        const firstDot = raw.indexOf('.');
        if (firstDot !== -1) {
          raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
        }
        // Truncate (not round) extra decimal digits as they're typed — a
        // toFixed()-style round-on-every-keystroke would reformat the value
        // mid-typing (e.g. "10.256" jumping to "10.26" the instant the 6 is
        // typed), which is jarring. Truncating just stops accepting further
        // decimal digits once the cap is reached, which reads as the field
        // "not allowing" more precision rather than silently rewriting it.
        if (decimals !== undefined) {
          const decimalIndex = raw.indexOf('.');
          if (decimalIndex !== -1 && raw.length - decimalIndex - 1 > decimals) {
            raw = raw.slice(0, decimalIndex + (decimals > 0 ? 1 + decimals : 0));
          }
        }
        setText(raw);
        onChange(raw === '' || raw === '.' ? 0 : Number(raw));
      }}
    />
  );
}
