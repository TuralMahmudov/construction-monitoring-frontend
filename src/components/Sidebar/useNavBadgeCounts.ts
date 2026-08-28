import { useMemo } from 'react';
import { useDocuments } from '../../features/documents/hooks/useDocuments';
import { DOCUMENT_STATUS } from '../../features/documents/types/document.types';
import { useFlaggedPrices } from '../../features/admin/flagged-prices/hooks/useFlaggedPrices';
import type { NavBadgeKey } from '../../types/navigation';

// One totalElements-only page (size:1) per counter — each list endpoint
// already returns only unresolved rows (bax navItems.tsx şərhi), so this
// number auto-decrements the moment a row is approved/rejected/confirmed,
// no separate "resolved" filtering needed on our side. Cheap: React Query
// caches these under their own key, independent of the actual review pages'
// own (page-size-25+) queries.
export function useNavBadgeCounts(options: { canReviewDocuments: boolean; canAccessAdmin: boolean }) {
  const documentsQuery = useDocuments({ status: DOCUMENT_STATUS.NEW, page: 0, size: 1 }, options.canReviewDocuments);
  const flaggedQuery = useFlaggedPrices(
    { page: 0, size: 1 },
    { enabled: options.canAccessAdmin },
  );

  return useMemo<Partial<Record<NavBadgeKey, number>>>(
    () => ({
      pendingDocuments: documentsQuery.data?.totalElements,
      flaggedPrices: flaggedQuery.data?.totalElements,
    }),
    [documentsQuery.data, flaggedQuery.data],
  );
}
