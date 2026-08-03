import type { ProductSearchParams } from '../types/product.types';

export const productKeys = {
  all: ['products'] as const,
  search: (params: ProductSearchParams) => [...productKeys.all, 'search', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  attributes: (id: string) => [...productKeys.all, 'attributes', id] as const,
};
