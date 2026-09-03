export type DocumentPreviewKind = 'pdf' | 'image' | 'excel' | 'word' | 'unsupported';

const EXCEL_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

const WORD_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

// contentType is the primary signal; the filename extension is only a
// fallback for the rare case a backend/proxy sends a generic
// application/octet-stream (bax FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 1.1
// üçün əsl contentType nümunəsi — normal halda bu kifayətdir).
export function getDocumentPreviewKind(contentType: string, filename: string): DocumentPreviewKind {
  if (contentType === 'application/pdf' || filename.endsWith('.pdf')) {
    return 'pdf';
  }
  if (contentType.startsWith('image/') || /\.(jpe?g|png)$/i.test(filename)) {
    return 'image';
  }
  if (EXCEL_CONTENT_TYPES.includes(contentType) || /\.xlsx?$/i.test(filename)) {
    return 'excel';
  }
  // Unlike excel (parsed client-side, bax DocumentPreviewPanel), word has no
  // in-browser renderer available — this kind always goes through the
  // backend's converted-PDF endpoint (bax FRONTEND_AI_PROMPT_DOCUMENT_PREVIEW.md).
  if (WORD_CONTENT_TYPES.includes(contentType) || /\.docx?$/i.test(filename)) {
    return 'word';
  }
  return 'unsupported';
}
