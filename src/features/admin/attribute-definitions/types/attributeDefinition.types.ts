// Confirmed via FRONTEND_AI_PROMPT_RESOURCE_CREATION.md (2026-07-28, bölmə
// 1.2) — dataType is an integer code, not the enum's name string.
// BRAND (6) — bax FRONTEND_AI_PROMPT_BRAND_IDENTITY.md § 0: sistem tərəfindən
// avtomatik yaradılan tək, təkrarlanmayan sətir ("Brend"). Admin bunu yenidən
// yarada bilməz — ATTRIBUTE_DATA_TYPE_OPTIONS-a (yaratma/filter dropdown-u)
// bilərəkdən əlavə edilmir, yalnız LABELS-də var ki, mövcud sətir read-only
// siyahılarda boş/xarab görünməsin.
export const ATTRIBUTE_DATA_TYPE = {
  NUMBER: 1,
  TEXT: 2,
  ENUM: 3,
  BOOLEAN: 4,
  DATE: 5,
  BRAND: 6,
} as const;

export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPE)[keyof typeof ATTRIBUTE_DATA_TYPE];

// The subset admin can actually choose when creating/editing a definition —
// excludes BRAND (6), the one system-managed, non-creatable type.
export type CreatableAttributeDataType = Exclude<AttributeDataType, 6>;

export const ATTRIBUTE_DATA_TYPE_OPTIONS: CreatableAttributeDataType[] = [1, 2, 3, 4, 5];

export const ATTRIBUTE_DATA_TYPE_LABELS: Record<AttributeDataType, string> = {
  1: 'Rəqəm',
  2: 'Mətn',
  3: 'Sabit siyahı',
  4: 'Bəli/Xeyr',
  5: 'Tarix',
  6: 'Brend (sistem)',
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
  dataType: CreatableAttributeDataType;
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
