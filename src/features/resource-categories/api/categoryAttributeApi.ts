import { apiDelete, apiGet, apiPost, apiPut } from '../../../services/httpClient';
import type {
  CategoryAttributeDefinition,
  LinkAttributeToCategoryFormValues,
  UpdateCategoryAttributeDefinitionFormValues,
} from '../types/categoryAttributeDefinition.types';

// Lives under /api/resource-categories/... for read/link, but PUT/DELETE on
// an existing link is its own top-level resource — both confirmed in
// PROJECT_STATUS.md bölmə 4o's endpoint list.
export function getCategoryAttributes(categoryId: string): Promise<CategoryAttributeDefinition[]> {
  return apiGet<CategoryAttributeDefinition[]>(`/api/resource-categories/${categoryId}/attributes`);
}

export function linkAttributeToCategory(
  categoryId: string,
  payload: LinkAttributeToCategoryFormValues,
): Promise<CategoryAttributeDefinition> {
  return apiPost<CategoryAttributeDefinition>(`/api/resource-categories/${categoryId}/attributes`, payload);
}

export function updateCategoryAttributeDefinition(
  id: string,
  payload: UpdateCategoryAttributeDefinitionFormValues,
): Promise<CategoryAttributeDefinition> {
  return apiPut<CategoryAttributeDefinition>(`/api/category-attribute-definitions/${id}`, payload);
}

export function unlinkCategoryAttributeDefinition(id: string): Promise<void> {
  return apiDelete<void>(`/api/category-attribute-definitions/${id}`);
}
