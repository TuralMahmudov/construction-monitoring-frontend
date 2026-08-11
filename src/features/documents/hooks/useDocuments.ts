import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ApiError } from '../../../services/httpClient';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import {
  createDocumentResources,
  downloadDocument,
  getDocuments,
  getMyDocuments,
  processDocument,
  updateDocumentStatus,
  uploadDocument,
} from '../api/documentsApi';
import type {
  CreateDocumentResourcesRequest,
  DocumentSearchParams,
  UpdateDocumentStatusRequest,
  UploadDocumentRequest,
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
