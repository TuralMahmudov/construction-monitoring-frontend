// Confirmed via FRONTEND_AI_PROMPT_RESOURCE_CREATION.md (2026-07-28, bölmə
// 1.2) — dataType is an integer code, not the enum's name string.
export const ATTRIBUTE_DATA_TYPE = {
  NUMBER: 1,
  TEXT: 2,
  ENUM: 3,
  BOOLEAN: 4,
  DATE: 5,
} as const;

export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPE)[keyof typeof ATTRIBUTE_DATA_TYPE];

export const ATTRIBUTE_DATA_TYPE_OPTIONS: AttributeDataType[] = [1, 2, 3, 4, 5];

export const ATTRIBUTE_DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  1: 'Rəqəm',
  2: 'Mətn',
  3: 'Sabit siyahı',
  4: 'Bəli/Xeyr',
  5: 'Tarix',
};

export interface AttributeEnumValue {
  id: string;
  attributeDefinitionId: string;
  value: string;
  sortOrder: number;
  active: boolean;
}

export interface AttributeEnumValueFormValues {
  value: string;
  sortOrder: number;
  active: boolean;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  dataType: AttributeDataType;
  defaultUnitId: string | null;
  defaultUnitCode: string | null;
  defaultUnitSymbol: string | null;
  active: boolean;
  // Only populated when dataType === ENUM.
  enumValues: AttributeEnumValue[];
}

export interface AttributeDefinitionFormValues {
  name: string;
  dataType: AttributeDataType;
  defaultUnitId: string | null;
  active: boolean;
}

export interface AttributeDefinitionSearchParams {
  name?: string;
  dataType?: AttributeDataType;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
