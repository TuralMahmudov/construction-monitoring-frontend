import type { MyResourceSearchParams } from '../types/myResource.types';

export const myResourceKeys = {
  all: ['my-resources'] as const,
  search: (params: MyResourceSearchParams) => [...myResourceKeys.all, 'search', params] as const,
  detail: (id: string) => [...myResourceKeys.all, 'detail', id] as const,
  attributeSchema: (categoryId: string) => [...myResourceKeys.all, 'attribute-schema', categoryId] as const,
  prices: (id: string) => [...myResourceKeys.all, 'prices', id] as const,
};
