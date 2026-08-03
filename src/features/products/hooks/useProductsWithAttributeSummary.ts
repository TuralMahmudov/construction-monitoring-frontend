import { useQueries, useQuery } from '@tanstack/react-query';
import { getProductAttributes, searchProducts } from '../api/productsApi';
import type { Product } from '../types/product.types';
import { productKeys } from './queryKeys';

const CATEGORY_PAGE_SIZE = 100;

export interface ProductWithAttributeSummary {
  product: Product;
  /** Comma-joined "Ad: dəyər" list — e.g. "Diametr: 12 mm, Uzunluq: 6 m".
   *  The attribute name is kept (not just the bare value) because a lone
   *  number like "1,5" means nothing on its own in a catalog tree. '' if the
   *  product has no attributes (bax ProductTreeItem for its name-fallback). */
  summary: string;
}

function formatSummary(
  attributes: { attributeName: string; value: string; unitSymbol: string | null; sortOrder: number }[],
): string {
  return [...attributes]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((attribute) => `${attribute.attributeName}: ${attribute.value}${attribute.unitSymbol ? ` ${attribute.unitSymbol}` : ''}`)
    .join(', ');
}

// Category-tree product leaves (bax CategoryTreeItem/CategoryProductTreePicker)
// need "name + comma-joined attributes" per row. There's no aggregate backend
// endpoint for this yet, so it's assembled client-side: one products-in-
// category query plus one attributes query per product, lazy (only runs when
// `enabled`, i.e. when that leaf category is actually expanded/opened).
export function useProductsWithAttributeSummary(categoryId: string, enabled: boolean) {
  const productsQuery = useQuery({
    queryKey: productKeys.search({ category: categoryId, active: true, size: CATEGORY_PAGE_SIZE, sort: 'name' }),
    queryFn: () => searchProducts({ category: categoryId, active: true, size: CATEGORY_PAGE_SIZE, sort: 'name' }),
    enabled,
  });

  const products = productsQuery.data?.content ?? [];

  const attributeQueries = useQueries({
    queries: products.map((product) => ({
      queryKey: productKeys.attributes(product.id),
      queryFn: () => getProductAttributes(product.id),
      enabled,
      staleTime: 5 * 60_000,
    })),
  });

  const items: ProductWithAttributeSummary[] = products.map((product, index) => ({
    product,
    summary: formatSummary(attributeQueries[index]?.data ?? []),
  }));

  return {
    items,
    isLoading: productsQuery.isLoading || attributeQueries.some((query) => query.isLoading),
    isError: productsQuery.isError || attributeQueries.some((query) => query.isError),
  };
}
