import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/productsApi';
import { productKeys } from './queryKeys';

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => getProductById(id as string),
    enabled: id !== null,
  });
}
