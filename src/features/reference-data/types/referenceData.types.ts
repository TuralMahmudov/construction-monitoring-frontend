// `code` is being dropped from the Unit/Region tables entirely (2026-07-31,
// backend task in progress) — Supplier keeps its own code, so it can no
// longer live on the shared base type.
export interface BaseReferenceItem {
  id: string;
  name: string;
  active: boolean;
}

export interface UnitItem extends BaseReferenceItem {
  symbol: string | null;
  decimalPrecision: number | null;
}

export type RegionItem = BaseReferenceItem;

export interface SupplierItem extends BaseReferenceItem {
  code: string;
}

export interface BaseReferenceFormValues {
  name: string;
  active: boolean;
}

export interface UnitFormValues extends BaseReferenceFormValues {
  symbol: string;
  decimalPrecision: number;
}

export interface SupplierFormValues extends BaseReferenceFormValues {
  code: string;
}

export interface ReferenceDataSearchParams {
  code?: string;
  name?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
