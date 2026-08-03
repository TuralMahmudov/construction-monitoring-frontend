import { apiGet, apiPost } from '../../../services/httpClient';
import type { MyResourcePrice, MyResourcePriceFormValues } from '../types/price.types';

const priceUrl = (resourceId: string) => `/api/resources/mine/${resourceId}/prices`;

export function listMyResourcePrices(resourceId: string): Promise<MyResourcePrice[]> {
  return apiGet<MyResourcePrice[]>(priceUrl(resourceId));
}

export function createMyResourcePrice(
  resourceId: string,
  payload: MyResourcePriceFormValues,
): Promise<MyResourcePrice> {
  return apiPost<MyResourcePrice>(priceUrl(resourceId), payload);
}
