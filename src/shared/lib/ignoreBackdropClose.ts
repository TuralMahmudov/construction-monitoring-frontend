// MUI Dialog/Drawer call onClose on backdrop click too, so a stray click
// outside a form silently discards it. Wrapping onClose with this filters
// that out — the window only closes via its own close/cancel button (or Esc).
export function ignoreBackdropClose(onClose: () => void) {
  return (_event: unknown, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason !== 'backdropClick') {
      onClose();
    }
  };
}
