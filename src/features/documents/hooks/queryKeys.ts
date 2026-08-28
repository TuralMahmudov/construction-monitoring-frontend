import type { DocumentSearchParams } from '../types/document.types';

export const documentKeys = {
  root: ['documents'] as const,
  mine: (params: DocumentSearchParams) => [...documentKeys.root, 'mine', params] as const,
  list: (params: DocumentSearchParams) => [...documentKeys.root, 'list', params] as const,
  resources: (documentId: string) => [...documentKeys.root, documentId, 'resources'] as const,
  preview: (documentId: string) => [...documentKeys.root, documentId, 'preview'] as const,
};
