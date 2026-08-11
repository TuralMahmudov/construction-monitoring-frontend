import { useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { PageContainer, PageHeader } from '../../../shared/components';
import { DocumentUploadDialog } from '../components/DocumentUploadDialog';
import { MyDocumentsTable } from '../components/MyDocumentsTable';
import { useDownloadDocument, useUploadDocument } from '../hooks/useDocuments';
import type { CcmsDocument, DocumentSearchParams } from '../types/document.types';

const DEFAULT_PARAMS = { page: 0, size: 10 } satisfies DocumentSearchParams;

export function MyDocumentsPage() {
  const [params, setParams] = useState<DocumentSearchParams>(DEFAULT_PARAMS);
  const [uploadOpen, setUploadOpen] = useState(false);

  const uploadMutation = useUploadDocument();
  const downloadMutation = useDownloadDocument();

  function updateParams(patch: Partial<DocumentSearchParams>) {
    setParams((prev) => ({ ...prev, ...patch }));
  }

  function handleUpload(file: File, description: string) {
    uploadMutation.mutate(
      { file, description: description || undefined },
      { onSuccess: () => setUploadOpen(false) },
    );
  }

  function handleDownload(doc: CcmsDocument) {
    downloadMutation.mutate({ id: doc.id, filename: doc.originalFilename });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sənəd İdxalı"
        subtitle="Qiymət siyahınızı yükləyin, mərkəzi işçi baxıb sistemə daxil edəcək"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setUploadOpen(true)}>
            Yeni sənəd yüklə
          </Button>
        }
      />

      <Card>
        <MyDocumentsTable
          params={{ page: params.page ?? 0, size: params.size ?? 10, ...params }}
          onParamsChange={updateParams}
          onDownload={handleDownload}
        />
      </Card>

      <DocumentUploadDialog
        open={uploadOpen}
        isSubmitting={uploadMutation.isPending}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />
    </PageContainer>
  );
}
