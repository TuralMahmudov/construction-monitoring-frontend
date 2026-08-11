import dayjs from 'dayjs';
import type { Product } from '../../products/types/product.types';
import type { BulkResourceRowResult } from '../types/document.types';

export interface BulkRowPriceState {
  enabled: boolean;
  regionId: string;
  price: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string;
}

interface BulkRowCommon {
  key: string;
  manufacturer: string;
  brand: string;
  model: string;
  specification: string;
  price: BulkRowPriceState;
  result: BulkResourceRowResult | null;
}

export interface ExistingRowState extends BulkRowCommon {
  kind: 'existing';
  product: Product;
  summary: string;
}

export interface NewRowState extends BulkRowCommon {
  kind: 'new';
  categoryId: string;
  name: string;
  unitId: string;
  attributeValues: Record<string, string>;
}

export type RowState = ExistingRowState | NewRowState;

function makeDefaultPrice(): BulkRowPriceState {
  return {
    enabled: false,
    regionId: '',
    price: 0,
    currency: 'AZN',
    effectiveDate: dayjs().format('YYYY-MM-DD'),
    expireDate: null,
    comment: '',
  };
}

export function makeExistingRow(product: Product, summary: string): ExistingRowState {
  return {
    key: product.id,
    kind: 'existing',
    product,
    summary,
    manufacturer: '',
    brand: '',
    model: '',
    specification: '',
    price: makeDefaultPrice(),
    result: null,
  };
}

export function makeNewRow(categoryId: string, defaultName: string): NewRowState {
  return {
    key: crypto.randomUUID(),
    kind: 'new',
    categoryId,
    name: defaultName,
    unitId: '',
    attributeValues: {},
    manufacturer: '',
    brand: '',
    model: '',
    specification: '',
    price: makeDefaultPrice(),
    result: null,
  };
}
