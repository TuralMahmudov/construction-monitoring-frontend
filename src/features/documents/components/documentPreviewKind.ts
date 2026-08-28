export type DocumentPreviewKind = 'pdf' | 'image' | 'excel' | 'unsupported';

const EXCEL_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
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
  return 'unsupported';
}
