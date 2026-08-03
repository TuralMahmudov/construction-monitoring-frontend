// The backend represents category type as a small integer enum: confirmed
// via /v3/api-docs (type: integer) plus empirical testing against the live
// API — 0 is rejected ("Unrecognized resource type: 0"), 1-5 are accepted.
// There is no lookup endpoint to resolve the ordinal-to-label mapping, so
// this assumes the same order the spec listed the categories in (materials,
// machinery, labor, transportation, services). Verify against the backend's
// actual enum definition if the labels look wrong for existing data.
export const CATEGORY_TYPES = [1, 2, 3, 4, 5] as const;

export const CATEGORY_TYPE_LABELS: Record<number, string> = {
  1: 'Material',
  2: 'Maşın-mexanizm',
  3: 'İşçi qüvvəsi',
  4: 'Nəqliyyat',
  5: 'Xidmət',
};

export function getCategoryTypeLabel(type: number): string {
  return CATEGORY_TYPE_LABELS[type] ?? String(type);
}

export interface ResourceCategory {
  id: string;
  parentId: string | null;
  name: string;
  type: number;
  level: number;
  sortOrder: number;
  leaf: boolean;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

export interface ResourceCategoryTreeNode extends ResourceCategory {
  children?: ResourceCategoryTreeNode[];
}

export interface CreateCategoryRequest {
  parentId: string | null;
  name: string;
  type: number;
  sortOrder: number;
  active: boolean;
}

// PUT /{id} (UpdateResourceCategoryRequest) only accepts these fields per
// the backend's OpenAPI schema — parent changes go through the dedicated
// /move endpoint, active through /enable /disable, and type is immutable
// after creation. `code` was dropped from the table 2026-07-31.
export interface UpdateCategoryRequest {
  name: string;
  sortOrder: number;
}

export type CategoryStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface CategorySearchParams {
  name?: string;
  status?: CategoryStatusFilter;
  type?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
