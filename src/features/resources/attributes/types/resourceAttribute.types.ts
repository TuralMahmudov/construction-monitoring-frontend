export interface ResourceAttribute {
  id: string;
  resourceId: string;
  attributeName: string;
  attributeValue: string;
  unit: string | null;
  sortOrder: number;
  searchable: boolean;
  required: boolean;
  active: boolean;
}

export interface ResourceAttributeFormValues {
  attributeName: string;
  attributeValue: string;
  unit: string;
  sortOrder: number;
  searchable: boolean;
  required: boolean;
  active: boolean;
}
