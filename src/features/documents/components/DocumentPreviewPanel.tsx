import { useEffect, useMemo, useState } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { getApiErrorMessage } from '../../../shared/lib/apiErrorMessage';
import {
  useDownloadDocument,
  useDocumentPreviewBlob,
  useDocumentPreviewFile,
  useDocumentPreviewStatusPoll,
} from '../hooks/useDocuments';
import { DOCUMENT_PREVIEW_STATUS, type CcmsDocument } from '../types/document.types';
import { getDocumentPreviewKind } from './documentPreviewKind';

export interface DocumentPreviewPanelProps {
  document: CcmsDocument;
}

// Sağ paneldəki cədvəl görünüşü — sheet_to_html-in çıxardığı çılpaq
// <table>-ə minimal stil verir (bax ExcelPreview aşağıda). Rəng/border kimi
// orijinal Excel formatlaşdırması bilərəkdən köçmür (SheetJS community
// versiyası bunu daşımır) — nəticə, işçinin diqqətini yayındırmayan təmiz
// data cədvəlidir.
const tableSx = {
  '& table': { borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' },
  '& td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5, fontSize: '0.8rem', whiteSpace: 'nowrap' },
} as const;

function DownloadFallback({
  message,
  onDownload,
  downloading,
}: {
  message: string;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 4, px: 2 }}>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DownloadRoundedIcon fontSize="small" />}
        onClick={onDownload}
        disabled={downloading}
      >
        Yüklə
      </Button>
    </Stack>
  );
}

function ExcelPreview({ blob }: { blob: Blob }) {
  const [sheets, setSheets] = useState<{ name: string; html: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSheets(null);
    setError(null);
    setActiveSheet(0);

    async function parse() {
      try {
        const [XLSX, buffer] = await Promise.all([import('xlsx'), blob.arrayBuffer()]);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const parsed = workbook.SheetNames.map((name) => ({
          name,
          html: XLSX.utils.sheet_to_html(workbook.Sheets[name], { header: '', footer: '' }),
        }));
        if (!cancelled) setSheets(parsed);
      } catch {
        if (!cancelled) setError('Fayl oxuna bilmədi — format dəstəklənmir və ya fayl zədəlidir.');
      }
    }
    void parse();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!sheets) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      {sheets.length > 1 && (
        <Tabs
          value={activeSheet}
          onChange={(_event, value) => setActiveSheet(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 32, borderBottom: 1, borderColor: 'divider' }}
        >
          {sheets.map((sheet, index) => (
            <Tab key={sheet.name} label={sheet.name} value={index} sx={{ minHeight: 32, py: 0.5 }} />
          ))}
        </Tabs>
      )}
      <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0, ...tableSx }} dangerouslySetInnerHTML={{ __html: sheets[activeSheet].html }} />
    </Stack>
  );
}

export function DocumentPreviewPanel({ document }: DocumentPreviewPanelProps) {
  const kind = useMemo(
    () => getDocumentPreviewKind(document.contentType, document.originalFilename),
    [document.contentType, document.originalFilename],
  );
  // pdf/image/excel all read the ORIGINAL file via /download (blobQuery) —
  // word instead goes through the backend's converted-PDF /preview endpoint
  // below, gated on previewStatus (bax FRONTEND_AI_PROMPT_DOCUMENT_PREVIEW.md).
  const blobQuery = useDocumentPreviewBlob(document.id, kind === 'excel' || kind === 'pdf' || kind === 'image');
  const downloadMutation = useDownloadDocument();

  // Only meaningful for 'word' — passing null for every other kind keeps
  // this inert (enabled: false) without an extra conditional-hook violation.
  const statusPoll = useDocumentPreviewStatusPoll(kind === 'word' ? document : null);
  const liveDocument = statusPoll.data ?? document;
  const wordConversionDone =
    liveDocument.previewStatus === DOCUMENT_PREVIEW_STATUS.NOT_APPLICABLE ||
    liveDocument.previewStatus === DOCUMENT_PREVIEW_STATUS.READY;
  const wordConversionFailed = liveDocument.previewStatus === DOCUMENT_PREVIEW_STATUS.FAILED;
  const previewFileQuery = useDocumentPreviewFile(document.id, kind === 'word' && wordConversionDone);

  const pdfBlob = kind === 'word' ? previewFileQuery.data : blobQuery.data;
  const objectUrl = useMemo(() => {
    if (!pdfBlob || (kind !== 'pdf' && kind !== 'image' && kind !== 'word')) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob, kind]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function handleDownload() {
    downloadMutation.mutate({ id: document.id, filename: document.originalFilename });
  }

  if (kind === 'unsupported') {
    return (
      <DownloadFallback
        message={`Bu fayl formatı (${document.originalFilename.split('.').pop()}) üçün önizləmə dəstəklənmir. Baxmaq üçün yükləyin.`}
        onDownload={handleDownload}
        downloading={downloadMutation.isPending}
      />
    );
  }

  if (kind === 'word') {
    if (wordConversionFailed) {
      return (
        <DownloadFallback
          message="Sənəd PDF-ə çevrilə bilmədi. Baxmaq üçün yükləyin."
          onDownload={handleDownload}
          downloading={downloadMutation.isPending}
        />
      );
    }
    if (!wordConversionDone) {
      return (
        <Stack spacing={1.5} sx={{ alignItems: 'center', py: 4 }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary" variant="body2">
            Hazırlanır...
          </Typography>
        </Stack>
      );
    }
    if (previewFileQuery.isLoading) {
      return (
        <Stack sx={{ alignItems: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      );
    }
    if (previewFileQuery.isError) {
      return <Alert severity="error">{getApiErrorMessage(previewFileQuery.error)}</Alert>;
    }
    if (!previewFileQuery.data) return null;
    return (
      <Box
        component="iframe"
        src={objectUrl ?? undefined}
        title={document.originalFilename}
        sx={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  }

  if (blobQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (blobQuery.isError) {
    return <Alert severity="error">{getApiErrorMessage(blobQuery.error)}</Alert>;
  }

  if (!blobQuery.data) return null;

  if (kind === 'excel') {
    return <ExcelPreview blob={blobQuery.data} />;
  }

  if (kind === 'pdf') {
    return (
      <Box
        component="iframe"
        src={objectUrl ?? undefined}
        title={document.originalFilename}
        sx={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  }

  // image
  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Box component="img" src={objectUrl ?? undefined} alt={document.originalFilename} sx={{ maxWidth: '100%' }} />
    </Box>
  );
}
