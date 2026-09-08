import { useEffect, useRef, useState } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export interface DebouncedTextFieldProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  /** Delay before `onChange` fires after the last keystroke. Default 400ms. */
  debounceMs?: number;
}

// Server-search text filters (Ad/Kod) call `onChange` straight into a
// `useSearchParams`-backed hook (bax useResourceSearchParams and siblings),
// which re-navigates on every keystroke. Typed fast enough — a paste, or
// automated typing — the next keystroke's onChange can fire before that
// navigation's re-render has landed, so its handler closes over the
// pre-update URL and the characters typed in between are silently dropped.
// A human typing at a normal pace rarely notices (each render cycle finishes
// well within the gap between keystrokes), but the field is fragile either
// way and fires a network request per keystroke with no debounce. Buffering
// the visible text locally and only pushing it upstream after a pause fixes
// both: the input can never lose a keystroke to a stale re-render, and the
// query only runs once typing settles.
export function DebouncedTextField({ value, onChange, debounceMs = 400, ...rest }: DebouncedTextFieldProps) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Only resync from the external value while unfocused — see NumberField
  // for why: otherwise the debounced onChange's own round-trip through this
  // prop would fight with what's still mid-typing.
  useEffect(() => {
    if (!focused) {
      setText(value);
    }
  }, [value, focused]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <TextField
      {...rest}
      value={text}
      onFocus={(event) => {
        setFocused(true);
        rest.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        clearTimeout(timerRef.current);
        onChange(text);
        rest.onBlur?.(event);
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(next), debounceMs);
      }}
    />
  );
}
