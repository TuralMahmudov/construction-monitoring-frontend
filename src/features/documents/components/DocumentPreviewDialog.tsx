import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { ignoreBackdropClose } from '../../../shared/lib/ignoreBackdropClose';
import type { CcmsDocument } from '../types/document.types';
import { DocumentPreviewPanel } from './DocumentPreviewPanel';

export interface DocumentPreviewDialogProps {
  document: CcmsDocument | null;
  onClose: () => void;
}

// Standalone "Sənədə bax" action on "Daxil olanlar" — lets a reviewer open
// the source file itself (to copy values while manually processing) without
// first starting a processing session, unlike the same DocumentPreviewPanel
// embedded in BulkResourceFormDialog's side panel. Full-screen (not just a
// tall maxWidth="md") — Tural, 2026-08-31: this dialog's whole purpose is
// reading the document, so it should use the full window, not share space
// with a form the way BulkResourceFormDialog's side panel does.
export function DocumentPreviewDialog({ document, onClose }: DocumentPreviewDialogProps) {
  return (
    <Dialog open={document !== null} onClose={ignoreBackdropClose(onClose)} fullScreen>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {document?.originalFilename ?? ''}
        <IconButton onClick={onClose} aria-label="bağla" size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          overflow: 'hidden',
          '& > *': { flex: 1, minHeight: 0 },
        }}
      >
        {document && <DocumentPreviewPanel document={document} />}
      </DialogContent>
    </Dialog>
  );
}
