import dayjs from 'dayjs';
import { PRICE_STATUS, type ResourcePrice } from '../types/resourcePrice.types';

export interface CurrentPriceEntry {
  organizationId: string;
  regionId: string;
  price: ResourcePrice;
}

/**
 * Derives "the current price per organization/region" client-side from the
 * full history, since the backend only exposes a lookup for one exact
 * resource+organization+region triple at a time (GET /resource-prices/current),
 * not "all current prices for this resource".
 */
export function groupCurrentPrices(prices: ResourcePrice[]): CurrentPriceEntry[] {
  const today = dayjs().startOf('day');
  const currentByOrgRegion = new Map<string, ResourcePrice>();

  prices.forEach((price) => {
    if (price.status !== PRICE_STATUS.APPROVED) {
      return;
    }
    if (dayjs(price.effectiveDate).isAfter(today)) {
      return;
    }
    if (price.expireDate && dayjs(price.expireDate).isBefore(today)) {
      return;
    }

    const key = `${price.organizationId}:${price.regionId}`;
    const existing = currentByOrgRegion.get(key);
    if (!existing || dayjs(price.effectiveDate).isAfter(dayjs(existing.effectiveDate))) {
      currentByOrgRegion.set(key, price);
    }
  });

  return Array.from(currentByOrgRegion.values()).map((price) => ({
    organizationId: price.organizationId,
    regionId: price.regionId,
    price,
  }));
}
