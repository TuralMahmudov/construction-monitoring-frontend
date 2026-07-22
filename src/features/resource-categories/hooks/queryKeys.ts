import type { CategorySearchParams } from '../types/resourceCategory.types';

export const categoryKeys = {
  all: ['resource-categories'] as const,
  tree: () => [...categoryKeys.all, 'tree'] as const,
  children: (parentId: string) => [...categoryKeys.all, 'children', parentId] as const,
  detail: (id: string) => [...categoryKeys.all, 'detail', id] as const,
  search: (params: CategorySearchParams) => [...categoryKeys.all, 'search', params] as const,
};
