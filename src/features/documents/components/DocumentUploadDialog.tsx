import { useState } from 'react';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';

// § 1.1 — server rejects anything else with 400; checked client-side too so
// the user isn't left waiting on a request that's certain to fail.
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export interface DocumentUploadDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (file: File, description: string) => void;
}

export function DocumentUploadDialog({ open, isSubmitting, onClose, onSubmit }: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setFile(null);
    setDescription('');
    setError(null);
    onClose();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!isAllowedFile(selected)) {
      setError(`Dəstəklənməyən fayl tipi. İcazə verilən: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError('Fayl ölçüsü 20MB-dan böyükdür.');
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleSubmit() {
    if (!file) {
      setError('Fayl seçin.');
      return;
    }
    onSubmit(file, description);
  }

  return (
    <Dialog open={open} onClose={ignoreBackdropClose(handleClose)} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Sənəd Yüklə</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileRoundedIcon />}
            disabled={isSubmitting}
          >
            {file ? file.name : 'Fayl seç'}
            <input type="file" hidden accept={ALLOWED_EXTENSIONS.join(',')} onChange={handleFileChange} />
          </Button>
          <Typography variant="caption" color="text.secondary">
            İcazə verilən formatlar: {ALLOWED_EXTENSIONS.join(', ')} — maks. 20MB.
          </Typography>

          <TextField
            label="Təsvir"
            fullWidth
            multiline
            minRows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
            placeholder="Məs. 2026 Q3 qiymət siyahısı"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Ləğv et
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Yüklənir...' : 'Yüklə'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
