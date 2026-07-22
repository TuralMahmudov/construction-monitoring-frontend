import { apiDelete, apiGet, apiPost, apiPut } from '../../../../services/httpClient';
import type { ResourceAttribute, ResourceAttributeFormValues } from '../types/resourceAttribute.types';

export function getResourceAttributes(resourceId: string): Promise<ResourceAttribute[]> {
  return apiGet<ResourceAttribute[]>(`/api/resources/${resourceId}/attributes`);
}

export function createResourceAttribute(
  resourceId: string,
  payload: ResourceAttributeFormValues,
): Promise<ResourceAttribute> {
  return apiPost<ResourceAttribute>('/api/resource-attributes', { ...payload, resourceId });
}

export function updateResourceAttribute(
  id: string,
  payload: ResourceAttributeFormValues,
): Promise<ResourceAttribute> {
  return apiPut<ResourceAttribute>(`/api/resource-attributes/${id}`, payload);
}

export function deleteResourceAttribute(id: string): Promise<void> {
  return apiDelete<void>(`/api/resource-attributes/${id}`);
}
