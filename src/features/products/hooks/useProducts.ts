import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchProducts } from '../api/productsApi';
import type { ProductSearchParams } from '../types/product.types';
import { productKeys } from './queryKeys';

export function useProducts(params: ProductSearchParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.search(params),
    queryFn: () => searchProducts(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}
