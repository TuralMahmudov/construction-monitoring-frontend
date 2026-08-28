import type { ProductAttributeInput } from '../../products/types/product.types';

// Confirmed shape (FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md § 1.1/§ 8.1) —
// `status` is an INTEGER on the Document itself (unlike the STRING sent to
// PATCH .../status, bax updateDocumentStatus in documentsApi.ts).
export const DOCUMENT_STATUS = {
  NEW: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  REJECTED: 4,
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  1: 'Yeni',
  2: 'Emalda',
  3: 'Tamamlandı',
  4: 'Rədd edildi',
};

export interface CcmsDocument {
  id: string;
  organizationId: string;
  organizationName: string;
  uploadedBy: string;
  uploadedByName: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  status: DocumentStatus;
  description: string | null;
  createdAt: string;
  // Only populated once IN_PROGRESS/COMPLETED (§ 2.1/§ 2.2).
  processedBy?: string | null;
  processedByName?: string | null;
  processedDate?: string | null;
  reviewComment?: string | null;
  // Added 2026-08-17 (FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md § 2) —
  // auto-set from createdAt on upload, null for pre-existing documents.
  periodYear: number | null;
  periodQuarter: number | null;
}

export interface DocumentSearchParams {
  organizationId?: string;
  status?: DocumentStatus;
  // Added 2026-08-19 (FRONTEND_AI_PROMPT_REPORTS_LIVE_AND_DOCUMENTS.md § "Hesabat #3").
  periodYear?: number;
  periodQuarter?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export interface UploadDocumentRequest {
  file: File;
  description?: string;
}

// PATCH /api/documents/{id}/status body (§ 2.3) — status is a STRING here,
// unlike the integer on CcmsDocument.status itself.
export interface UpdateDocumentStatusRequest {
  status: 'COMPLETED' | 'REJECTED';
  reviewComment?: string;
}

// POST /api/documents/{id}/resources row (§ 3.3) — exactly one of
// `productId`/`newProduct` per row, never both.
export interface BulkResourcePriceInput {
  regionId: string;
  price: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment?: string;
}

export interface BulkResourceNewProductInput {
  categoryId: string;
  name: string;
  unitId: string;
  attributes: ProductAttributeInput[];
}

export interface BulkResourceRowRequest {
  productId?: string;
  newProduct?: BulkResourceNewProductInput;
  // Optional per Tural, 2026-08-26: omitted entirely for İşçi qüvvəsi
  // (category type 3) rows — bax BACKEND_REQUEST_MANUFACTURER_OPTIONAL_FOR_LABOR_CATEGORY.md.
  manufacturer?: string;
  brand?: string;
  model?: string;
  specification?: string;
  price?: BulkResourcePriceInput;
}

export interface CreateDocumentResourcesRequest {
  rows: BulkResourceRowRequest[];
}

export interface BulkResourceRowResult {
  index: number;
  success: boolean;
  resourceId?: string;
  error?: string;
}

export interface CreateDocumentResourcesResponse {
  results: BulkResourceRowResult[];
}

// PATCH /api/documents/{id}/period body (§ 2) — DOCUMENT_REVIEW only, 400s
// once the document is COMPLETED.
export interface UpdateDocumentPeriodRequest {
  periodYear: number;
  periodQuarter: number;
}
