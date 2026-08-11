import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import type { CcmsDocument } from '../types/document.types';

export interface DocumentRejectDialogProps {
  document: CcmsDocument | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reviewComment: string) => void;
}

// § 2.3 — backend only treats reviewComment as "tövsiyə olunur"
// (recommended), but leaving it empty gives the vendor no reason at all for
// the rejection, so the frontend requires it even though the API wouldn't.
export function DocumentRejectDialog({ document, isSubmitting, onClose, onConfirm }: DocumentRejectDialogProps) {
  const [reviewComment, setReviewComment] = useState('');
  const [touched, setTouched] = useState(false);
  const isEmpty = reviewComment.trim() === '';

  function handleClose() {
    setReviewComment('');
    setTouched(false);
    onClose();
  }

  function handleConfirm() {
    if (isEmpty) {
      setTouched(true);
      return;
    }
    onConfirm(reviewComment);
  }

  return (
    <Dialog open={document !== null} onClose={ignoreBackdropClose(handleClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Sənədi rədd et</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="warning">"{document?.originalFilename}" rədd ediləcək.</Alert>
          <TextField
            label="Səbəb *"
            fullWidth
            multiline
            minRows={2}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            disabled={isSubmitting}
            error={touched && isEmpty}
            helperText={touched && isEmpty ? 'Rədd səbəbini yazmaq məcburidir.' : 'Təşkilat bu səbəbi görəcək.'}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Ləğv et
        </Button>
        <Button color="error" variant="contained" onClick={handleConfirm} disabled={isSubmitting}>
          Rədd et
        </Button>
      </DialogActions>
    </Dialog>
  );
}
