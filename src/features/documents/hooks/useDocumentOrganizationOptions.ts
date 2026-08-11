import { useMemo } from 'react';
import { useDocuments } from './useDocuments';

const LOOKUP_PAGE_SIZE = 200;

export interface DocumentOrganizationOption {
  id: string;
  name: string;
}

// The admin document list's org filter needs an org id->name list, but
// GET /api/organizations requires ORGANIZATION_READ (admin-only) while
// DOCUMENT_REVIEW holders like ANALYST are not guaranteed that permission
// (bax shared/lib/permissions.ts § canReviewDocuments). GET /api/documents
// already denormalizes organizationName onto every row and DOCUMENT_REVIEW
// holders can always call it, so the filter's option list is derived from
// an unfiltered page of documents instead of a separate org lookup — an org
// with zero documents has nothing to filter by anyway.
export function useDocumentOrganizationOptions(enabled = true) {
  const query = useDocuments({ page: 0, size: LOOKUP_PAGE_SIZE }, enabled);

  return useMemo(() => {
    const seen = new Map<string, DocumentOrganizationOption>();
    (query.data?.content ?? []).forEach((doc) => {
      if (!seen.has(doc.organizationId)) {
        seen.set(doc.organizationId, { id: doc.organizationId, name: doc.organizationName });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [query.data]);
}
