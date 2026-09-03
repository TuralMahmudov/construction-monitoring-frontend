import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import {
  createDocumentResources,
  downloadDocument,
  fetchDocumentBlob,
  fetchDocumentPreviewFile,
  getDocument,
  getDocuments,
  getMyDocuments,
  processDocument,
  updateDocumentPeriod,
  updateDocumentStatus,
  uploadDocument,
} from '../api/documentsApi';
import {
  DOCUMENT_PREVIEW_STATUS,
  type CreateDocumentResourcesRequest,
  type DocumentSearchParams,
  type UpdateDocumentPeriodRequest,
  type UpdateDocumentStatusRequest,
  type UploadDocumentRequest,
} from '../types/document.types';
import { documentKeys } from './queryKeys';

// § 2.2 — the 409 lock-conflict message already names the current processor
// ("...being processed by Əli Vəliyev"), so unlike the generic
// getApiErrorMessage mapping, that one specific case is shown verbatim.
function documentActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return error.message;
  }
  return getApiErrorMessage(error);
}

export function useMyDocuments(params: DocumentSearchParams) {
  return useQuery({
    queryKey: documentKeys.mine(params),
    queryFn: () => getMyDocuments(params),
  });
}

export function useDocuments(params: DocumentSearchParams, enabled = true) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
    enabled,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (payload: UploadDocumentRequest) => uploadDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.root });
      enqueueSnackbar('Sənəd yükləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}

export function useDownloadDocument() {
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) => downloadDocument(id, filename),
    onError: (error) => enqueueSnackbar(getApiErrorMessage(error), { variant: 'error' }),
  });
}

// Backs DocumentPreviewPanel — the blob doesn't change while a document is
// being processed, so it's fetched once per document and kept (staleTime:
// Infinity avoids a refetch every time the panel remounts, e.g. switching
// categories in BulkResourceFormDialog doesn't touch this).
export function useDocumentPreviewBlob(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: documentKeys.preview(documentId),
    queryFn: () => fetchDocumentBlob(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}

// Word (doc/docx) preview — re-fetches the document itself every few seconds
// while previewStatus is PENDING (background conversion in progress), stops
// once it flips to READY/FAILED. Only meaningful for 'word' kind; other
// kinds never sit in PENDING long enough to matter and don't call this.
//
// `refetchInterval` as a FUNCTION (not a flat 3000) matters here — it's
// re-evaluated against each fetch's own freshly-returned previewStatus, so
// polling actually stops once conversion finishes. `enabled` alone can't do
// this: it's derived from the `document` prop, which the caller doesn't
// update mid-poll, so a flat interval would keep firing forever.
export function useDocumentPreviewStatusPoll(document: { id: string; previewStatus: number } | null) {
  return useQuery({
    queryKey: documentKeys.detail(document?.id ?? ''),
    queryFn: () => getDocument(document!.id),
    enabled: document !== null && document.previewStatus === DOCUMENT_PREVIEW_STATUS.PENDING,
    refetchInterval: (query) => (query.state.data?.previewStatus === DOCUMENT_PREVIEW_STATUS.PENDING ? 3000 : false),
  });
}

// The converted PDF bytes from GET /{id}/preview — only call once
// previewStatus is NOT_APPLICABLE/READY (bax fetchDocumentPreviewFile's own
// comment), staleTime: Infinity for the same reason as useDocumentPreviewBlob.
export function useDocumentPreviewFile(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: documentKeys.previewFile(documentId),
    queryFn: () => fetchDocumentPreviewFile(documentId),
    enabled: enabled && Boolean(documentId),
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
  });
}

// Opens/continues a processing session — caller opens the bulk-create form
// only after this resolves, so the lock is confirmed to be held.
export function useProcessDocument() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => processDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.root });
    },
    onError: (error) => enqueueSnackbar(documentActionErrorMessage(error), { variant: 'error' }),
  });
}

export function useCompleteDocument() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (id: string) => updateDocumentStatus(id, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.root });
      enqueueSnackbar('Sənədin emalı tamamlandı.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(documentActionErrorMessage(error), { variant: 'error' }),
  });
}

export function useUpdateDocumentPeriod() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentPeriodRequest }) =>
      updateDocumentPeriod(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.root });
      enqueueSnackbar('Rüb yeniləndi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(documentActionErrorMessage(error), { variant: 'error' }),
  });
}

export function useRejectDocument() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentStatusRequest }) =>
      updateDocumentStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.root });
      enqueueSnackbar('Sənəd rədd edildi.', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(documentActionErrorMessage(error), { variant: 'error' }),
  });
}

// No onSuccess invalidate/snackbar here on purpose — the form needs the raw
// per-row results (§ 3.3) to mark failed rows individually, and a partial
// batch (some rows failed) isn't a clean "success" toast moment. The caller
// (BulkResourceFormDialog) handles both the toast and the invalidate once it
// has looked at `results`.
export function useCreateDocumentResources() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, payload }: { documentId: string; payload: CreateDocumentResourcesRequest }) =>
      createDocumentResources(documentId, payload),
    onSuccess: (_data, { documentId }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.resources(documentId) });
    },
  });
}
