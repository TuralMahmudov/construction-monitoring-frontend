import dayjs from 'dayjs';
import { PRICE_STATUS, type ResourcePrice } from '../types/resourcePrice.types';

export interface CurrentPriceEntry {
  supplierId: string;
  regionId: string;
  price: ResourcePrice;
}

/**
 * Derives "the current price per supplier/region" client-side from the full
 * history, since the backend only exposes a lookup for one exact
 * resource+supplier+region triple at a time (GET /resource-prices/current),
 * not "all current prices for this resource".
 */
export function groupCurrentPrices(prices: ResourcePrice[]): CurrentPriceEntry[] {
  const today = dayjs().startOf('day');
  const currentBySupplierRegion = new Map<string, ResourcePrice>();

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

    const key = `${price.supplierId}:${price.regionId}`;
    const existing = currentBySupplierRegion.get(key);
    if (!existing || dayjs(price.effectiveDate).isAfter(dayjs(existing.effectiveDate))) {
      currentBySupplierRegion.set(key, price);
    }
  });

  return Array.from(currentBySupplierRegion.values()).map((price) => ({
    supplierId: price.supplierId,
    regionId: price.regionId,
    price,
  }));
}
