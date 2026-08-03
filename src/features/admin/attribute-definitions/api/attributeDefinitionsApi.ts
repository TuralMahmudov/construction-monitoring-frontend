import { apiDelete, apiGet, apiPost, apiPut } from '../../../../services/httpClient';
import type { PageResponse } from '../../../../shared/types/pagination.types';
import type {
  AttributeDefinition,
  AttributeDefinitionFormValues,
  AttributeDefinitionSearchParams,
  AttributeEnumValue,
  AttributeEnumValueFormValues,
} from '../types/attributeDefinition.types';

const BASE_URL = '/api/attribute-definitions';

export function searchAttributeDefinitions(
  params: AttributeDefinitionSearchParams,
): Promise<PageResponse<AttributeDefinition>> {
  return apiGet<PageResponse<AttributeDefinition>>(BASE_URL, { ...params });
}

export function getAttributeDefinitionById(id: string): Promise<AttributeDefinition> {
  return apiGet<AttributeDefinition>(`${BASE_URL}/${id}`);
}

export function createAttributeDefinition(
  payload: AttributeDefinitionFormValues,
): Promise<AttributeDefinition> {
  return apiPost<AttributeDefinition>(BASE_URL, payload);
}

export function updateAttributeDefinition(
  id: string,
  payload: AttributeDefinitionFormValues,
): Promise<AttributeDefinition> {
  return apiPut<AttributeDefinition>(`${BASE_URL}/${id}`, payload);
}

export function deleteAttributeDefinition(id: string): Promise<void> {
  return apiDelete<void>(`${BASE_URL}/${id}`);
}

// Nested under the owning definition — only ENUM-typed definitions accept
// enum values (bax PROJECT_STATUS.md bölmə 4o).
export function getAttributeEnumValues(definitionId: string): Promise<AttributeEnumValue[]> {
  return apiGet<AttributeEnumValue[]>(`${BASE_URL}/${definitionId}/enum-values`);
}

export function createAttributeEnumValue(
  definitionId: string,
  payload: AttributeEnumValueFormValues,
): Promise<AttributeEnumValue> {
  return apiPost<AttributeEnumValue>(`${BASE_URL}/${definitionId}/enum-values`, payload);
}

export function updateAttributeEnumValue(
  definitionId: string,
  enumValueId: string,
  payload: AttributeEnumValueFormValues,
): Promise<AttributeEnumValue> {
  return apiPut<AttributeEnumValue>(`${BASE_URL}/${definitionId}/enum-values/${enumValueId}`, payload);
}

export function deleteAttributeEnumValue(definitionId: string, enumValueId: string): Promise<void> {
  return apiDelete<void>(`${BASE_URL}/${definitionId}/enum-values/${enumValueId}`);
}
