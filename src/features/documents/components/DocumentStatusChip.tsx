import Chip from '@mui/material/Chip';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS, type DocumentStatus } from '../types/document.types';

const COLORS: Record<DocumentStatus, 'warning' | 'info' | 'success' | 'error'> = {
  [DOCUMENT_STATUS.NEW]: 'warning',
  [DOCUMENT_STATUS.IN_PROGRESS]: 'info',
  [DOCUMENT_STATUS.COMPLETED]: 'success',
  [DOCUMENT_STATUS.REJECTED]: 'error',
};

export interface DocumentStatusChipProps {
  status: DocumentStatus;
}

export function DocumentStatusChip({ status }: DocumentStatusChipProps) {
  return <Chip size="small" label={DOCUMENT_STATUS_LABELS[status]} color={COLORS[status]} />;
}
