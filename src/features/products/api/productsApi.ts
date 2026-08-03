import { apiGet, apiPatch, apiPost, apiPut } from '../../../services/httpClient';
import type { PageResponse } from '../../../shared/types/pagination.types';
import type {
  Product,
  ProductAttribute,
  ProductCreateRequest,
  ProductFindOrCreateResponse,
  ProductReviewResponse,
  ProductReviewSearchParams,
  ProductSearchParams,
  ProductUpdateRequest,
} from '../types/product.types';

const BASE_URL = '/api/products';

export function searchProducts(params: ProductSearchParams): Promise<PageResponse<Product>> {
  return apiGet<PageResponse<Product>>(BASE_URL, { ...params });
}

export function getProductById(id: string): Promise<Product> {
  return apiGet<Product>(`${BASE_URL}/${id}`);
}

export function getProductAttributes(id: string): Promise<ProductAttribute[]> {
  return apiGet<ProductAttribute[]>(`${BASE_URL}/${id}/attributes`);
}

// Find-or-create (§ 2) — 201 when a new product was created, 200 when an
// existing one matched; the envelope's `data.matched` is what distinguishes
// the two, not the HTTP status (apiPost only surfaces `data`).
export function findOrCreateProduct(payload: ProductCreateRequest): Promise<ProductFindOrCreateResponse> {
  return apiPost<ProductFindOrCreateResponse>(BASE_URL, payload);
}

export function updateProduct(id: string, payload: ProductUpdateRequest): Promise<Product> {
  return apiPut<Product>(`${BASE_URL}/${id}`, payload);
}

export function enableProduct(id: string): Promise<void> {
  return apiPatch<void>(`${BASE_URL}/${id}/enable`);
}

export function disableProduct(id: string): Promise<void> {
  return apiPatch<void>(`${BASE_URL}/${id}/disable`);
}

export function getPendingReviewProducts(
  params: ProductReviewSearchParams,
): Promise<PageResponse<ProductReviewResponse>> {
  return apiGet<PageResponse<ProductReviewResponse>>(`${BASE_URL}/pending-review`, { ...params });
}

export function confirmProduct(id: string): Promise<ProductReviewResponse> {
  return apiPatch<ProductReviewResponse>(`${BASE_URL}/${id}/confirm`);
}
