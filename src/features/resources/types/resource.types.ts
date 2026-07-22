export interface Resource {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  description: string | null;
  unitId: string | null;
  specification: string | null;
  manufacturer: string | null;
  brand: string | null;
  model: string | null;
  active: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy: string | null;
  modifiedDate: string | null;
}

export interface ResourceFormValues {
  categoryId: string;
  code: string;
  name: string;
  description: string;
  unitId: string | null;
  specification: string;
  manufacturer: string;
  brand: string;
  model: string;
  active: boolean;
}

// Note the query param names below are `category`/`unit`, not
// `categoryId`/`unitId` — confirmed against the live backend's OpenAPI spec.
export interface ResourceSearchParams {
  name?: string;
  code?: string;
  category?: string;
  manufacturer?: string;
  brand?: string;
  unit?: string;
  status?: boolean;
  attributeName?: string;
  attributeValue?: string;
  page?: number;
  size?: number;
  sort?: string;
}
