import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useAuth } from '../../../hooks/useAuth';
import { PageContainer, PageHeader } from '../../../shared/components';
import { canReviewDocuments } from '../../../shared/lib/permissions';
import { BulkResourceFormDialog } from '../components/BulkResourceFormDialog';
import { DocumentRejectDialog } from '../components/DocumentRejectDialog';
import { DocumentResourcesViewDialog } from '../components/DocumentResourcesViewDialog';
import { DocumentsAdminTable } from '../components/DocumentsAdminTable';
import { useDocumentOrganizationOptions } from '../hooks/useDocumentOrganizationOptions';
import { useDownloadDocument, useProcessDocument, useRejectDocument } from '../hooks/useDocuments';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS, type CcmsDocument, type DocumentSearchParams, type DocumentStatus } from '../types/document.types';

const DEFAULT_PARAMS = { page: 0, size: 10 } satisfies DocumentSearchParams;
const STATUS_OPTIONS = Object.values(DOCUMENT_STATUS) as DocumentStatus[];

export function DocumentsAdminPage() {
  const { user } = useAuth();
  const canAccess = canReviewDocuments(user);
  const [params, setParams] = useState<DocumentSearchParams>(DEFAULT_PARAMS);
  const [processingDocument, setProcessingDocument] = useState<CcmsDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<CcmsDocument | null>(null);
  const [rejectingDocument, setRejectingDocument] = useState<CcmsDocument | null>(null);

  const orgOptions = useDocumentOrganizationOptions(canAccess);
  const downloadMutation = useDownloadDocument();
  const processMutation = useProcessDocument();
  const rejectMutation = useRejectDocument();

  // Cross-tenant data: this table shows every organization's uploaded
  // documents (names, descriptions, download access) — DOCUMENT_REVIEW is
  // not optional here, unlike the softer hideForOrganization pages.
  if (!canAccess) {
    return (
      <PageContainer>
        <Alert severity="warning">Bu səhifəyə girişiniz yoxdur.</Alert>
      </PageContainer>
    );
  }

  function updateParams(patch: Partial<DocumentSearchParams>) {
    setParams((prev) => ({ ...prev, ...patch, page: 0 }));
  }

  function handleDownload(doc: CcmsDocument) {
    downloadMutation.mutate({ id: doc.id, filename: doc.originalFilename });
  }

  // § 2.2 — always (re-)acquire/confirm the lock before opening the bulk
  // form; idempotent if it's already ours, 409 surfaces as a toast if
  // someone else grabbed it in the meantime.
  function handleProcess(doc: CcmsDocument) {
    processMutation.mutate(doc.id, { onSuccess: () => setProcessingDocument(doc) });
  }

  function handleReject(reviewComment: string) {
    if (!rejectingDocument) return;
    rejectMutation.mutate(
      { id: rejectingDocument.id, payload: { status: 'REJECTED', reviewComment: reviewComment || undefined } },
      { onSuccess: () => setRejectingDocument(null) },
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Daxil olanlar" subtitle="Təşkilatların idxal etdiyi sənədlər və emalları" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
              options={orgOptions}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={orgOptions.find((org) => org.id === params.organizationId) ?? null}
              onChange={(_event, newValue) => updateParams({ organizationId: newValue?.id })}
              sx={{ minWidth: 240 }}
              renderInput={(inputParams) => <TextField {...inputParams} label="Təşkilat" size="small" />}
            />
            <TextField
              select
              label="Status"
              size="small"
              sx={{ minWidth: 180 }}
              value={params.status ?? ''}
              onChange={(event) => updateParams({ status: event.target.value ? (Number(event.target.value) as DocumentStatus) : undefined })}
            >
              <MenuItem value="">Hamısı</MenuItem>
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {DOCUMENT_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <DocumentsAdminTable
          params={{ page: params.page ?? 0, size: params.size ?? 10, ...params }}
          onParamsChange={(patch) => setParams((prev) => ({ ...prev, ...patch }))}
          currentUserId={user?.id ?? ''}
          onDownload={handleDownload}
          onProcess={handleProcess}
          onViewResources={setViewingDocument}
          onReject={setRejectingDocument}
        />
      </Card>

      <BulkResourceFormDialog document={processingDocument} onClose={() => setProcessingDocument(null)} />

      <DocumentResourcesViewDialog document={viewingDocument} onClose={() => setViewingDocument(null)} />

      <DocumentRejectDialog
        document={rejectingDocument}
        isSubmitting={rejectMutation.isPending}
        onClose={() => setRejectingDocument(null)}
        onConfirm={handleReject}
      />
    </PageContainer>
  );
}
