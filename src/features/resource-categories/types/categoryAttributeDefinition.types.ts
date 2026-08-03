import type {
  AttributeDataType,
  AttributeEnumValue,
} from '../../admin/attribute-definitions/types/attributeDefinition.types';

// The "link" row that makes a global AttributeDefinition usable on resources
// within one category. Confirmed shape (FRONTEND_AI_PROMPT_RESOURCE_CREATION.md
// bölmə 1.4) — this row's own `id` (not attributeDefinitionId) is what
// resource-attribute creation references as categoryAttributeDefinitionId.
export interface CategoryAttributeDefinition {
  id: string;
  categoryId: string;
  attributeDefinitionId: string;
  attributeName: string;
  dataType: AttributeDataType;
  defaultUnitId: string | null;
  defaultUnitCode: string | null;
  defaultUnitSymbol: string | null;
  enumValues: AttributeEnumValue[];
  required: boolean;
  visible: boolean;
  searchable: boolean;
  filterable: boolean;
  sortOrder: number;
  affectsMatchGroup: boolean;
}

export interface LinkAttributeToCategoryFormValues {
  attributeDefinitionId: string;
  required: boolean;
  visible: boolean;
  searchable: boolean;
  filterable: boolean;
  sortOrder: number;
  affectsMatchGroup: boolean;
}

export interface UpdateCategoryAttributeDefinitionFormValues {
  required: boolean;
  visible: boolean;
  searchable: boolean;
  filterable: boolean;
  sortOrder: number;
  affectsMatchGroup: boolean;
}
