import { useQuery } from '@tanstack/react-query';
import { getProductAttributes } from '../api/productsApi';
import { productKeys } from './queryKeys';

export function useProductAttributes(productId: string | null) {
  return useQuery({
    queryKey: productKeys.attributes(productId ?? ''),
    queryFn: () => getProductAttributes(productId as string),
    enabled: productId !== null,
  });
}
