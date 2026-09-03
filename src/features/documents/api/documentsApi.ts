import { apiGet, apiPatch, apiPost, httpClient } from '../../../services/httpClient';
import type { ApiSuccessResponse } from '../../../types/api';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type {
  CcmsDocument,
  CreateDocumentResourcesRequest,
  CreateDocumentResourcesResponse,
  DocumentSearchParams,
  UpdateDocumentPeriodRequest,
  UpdateDocumentStatusRequest,
  UploadDocumentRequest,
} from '../types/document.types';

const BASE_URL = '/api/documents';

// multipart/form-data (§ 1.1) — apiPost always sends JSON, so this bypasses
// it and builds the FormData directly; axios sets the multipart boundary
// header itself once it sees a FormData body.
export async function uploadDocument({ file, description }: UploadDocumentRequest): Promise<CcmsDocument> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }
  const response = await httpClient.post<ApiSuccessResponse<CcmsDocument>>(BASE_URL, formData);
  return response.data.data as CcmsDocument;
}

export function getMyDocuments(params: DocumentSearchParams): Promise<PageResponse<CcmsDocument>> {
  return apiGet<PageResponse<CcmsDocument>>(`${BASE_URL}/mine`, { ...params });
}

export function getDocuments(params: DocumentSearchParams): Promise<PageResponse<CcmsDocument>> {
  return apiGet<PageResponse<CcmsDocument>>(BASE_URL, { ...params });
}

// Used to poll a single document's previewStatus while PENDING (bax
// useDocumentPreviewStatusPoll) — the list/mine endpoints would also work
// but re-fetching one row by id is cheaper than re-running a whole search.
export function getDocument(id: string): Promise<CcmsDocument> {
  return apiGet<CcmsDocument>(`${BASE_URL}/${id}`);
}

// Auth-protected stream (§ 1.3) — a plain <a href> can't attach the JWT
// header, so this fetches the blob through httpClient (which does) and
// triggers the save via a throwaway <a download>.
export async function downloadDocument(id: string, filename: string): Promise<void> {
  const response = await httpClient.get<Blob>(`${BASE_URL}/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Same stream as downloadDocument, minus the save-as trigger — used by
// DocumentPreviewPanel to get an in-app object URL / ArrayBuffer instead of
// pushing the file to disk.
export async function fetchDocumentBlob(id: string): Promise<Blob> {
  const response = await httpClient.get<Blob>(`${BASE_URL}/${id}/download`, { responseType: 'blob' });
  return response.data;
}

// GET /{id}/preview (FRONTEND_AI_PROMPT_DOCUMENT_PREVIEW.md § 2) — ALWAYS a
// PDF (converted for Excel/Word, the original bytes as-is for PDF/image),
// unlike fetchDocumentBlob above which is always the original file. Caller
// must check previewStatus first (NOT_APPLICABLE/READY) — PENDING/FAILED
// 409s here.
export async function fetchDocumentPreviewFile(id: string): Promise<Blob> {
  const response = await httpClient.get<Blob>(`${BASE_URL}/${id}/preview`, { responseType: 'blob' });
  return response.data;
}

// PATCH /api/documents/{id}/process (§ 2.2) — no body, idempotent while the
// lock is already yours; 409 (someone else's lock, or already terminal) is
// left for the caller to catch and show as a toast.
export function processDocument(id: string): Promise<CcmsDocument> {
  return apiPatch<CcmsDocument>(`${BASE_URL}/${id}/process`);
}

export function updateDocumentStatus(id: string, payload: UpdateDocumentStatusRequest): Promise<CcmsDocument> {
  return apiPatch<CcmsDocument>(`${BASE_URL}/${id}/status`, payload);
}

// § 2 — DOCUMENT_REVIEW only, 400s once status === COMPLETED.
export function updateDocumentPeriod(id: string, payload: UpdateDocumentPeriodRequest): Promise<CcmsDocument> {
  return apiPatch<CcmsDocument>(`${BASE_URL}/${id}/period`, payload);
}

// § 3.3 — requires the caller to already hold the document's lock
// (processDocument first); each row is independent, bax
// CreateDocumentResourcesResponse.results for per-row success/error.
export function createDocumentResources(
  id: string,
  payload: CreateDocumentResourcesRequest,
): Promise<CreateDocumentResourcesResponse> {
  return apiPost<CreateDocumentResourcesResponse>(`${BASE_URL}/${id}/resources`, payload);
}
