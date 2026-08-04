// `code` was dropped from the Unit/Region tables entirely (2026-07-31).
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

export interface BaseReferenceFormValues {
  name: string;
  active: boolean;
}

export interface UnitFormValues extends BaseReferenceFormValues {
  symbol: string;
  decimalPrecision: number;
}

export interface ReferenceDataSearchParams {
  code?: string;
  name?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
