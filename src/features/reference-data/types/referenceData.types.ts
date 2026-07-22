export interface BaseReferenceItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface UnitItem extends BaseReferenceItem {
  symbol: string | null;
  decimalPrecision: number | null;
}

export type RegionItem = BaseReferenceItem;
export type SupplierItem = BaseReferenceItem;

export interface BaseReferenceFormValues {
  code: string;
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
