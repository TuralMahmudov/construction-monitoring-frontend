import type { ResourceSearchParams } from '../types/resource.types';

export const resourceKeys = {
  all: ['resources'] as const,
  search: (params: ResourceSearchParams) => [...resourceKeys.all, 'search', params] as const,
  detail: (id: string) => [...resourceKeys.all, 'detail', id] as const,
};
