import type { DocumentSearchParams } from '../types/document.types';

export const documentKeys = {
  root: ['documents'] as const,
  mine: (params: DocumentSearchParams) => [...documentKeys.root, 'mine', params] as const,
  list: (params: DocumentSearchParams) => [...documentKeys.root, 'list', params] as const,
  resources: (documentId: string) => [...documentKeys.root, documentId, 'resources'] as const,
  // Raw /download bytes, used for excel/pdf/image in-app preview (bax
  // useDocumentPreviewBlob) — NOT the same thing as previewFile below,
  // despite the name; kept as-is to avoid churning existing call sites.
  preview: (documentId: string) => [...documentKeys.root, documentId, 'preview'] as const,
  // Single-document re-fetch, used to poll previewStatus while PENDING
  // (word→PDF conversion in progress) — bax FRONTEND_AI_PROMPT_DOCUMENT_PREVIEW.md.
  detail: (documentId: string) => [...documentKeys.root, documentId, 'detail'] as const,
  // The converted PDF bytes from GET /{id}/preview — distinct from `preview`
  // above (which is actually the original file via /download).
  previewFile: (documentId: string) => [...documentKeys.root, documentId, 'previewFile'] as const,
};
