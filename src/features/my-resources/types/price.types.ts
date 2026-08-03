// No `supplierId`/`vat` here (unlike the general resource-prices module) —
// the supplier is implicit: the current user's own organization. Otherwise
// mirrors the shape of the existing price form (effectiveDate + optional
// open-ended expireDate), just with `comment` added.
export interface MyResourcePrice {
  id: string;
  resourceId: string;
  regionId: string;
  price: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string | null;
  createdDate: string;
}

export interface MyResourcePriceFormValues {
  regionId: string;
  price: number;
  currency: string;
  effectiveDate: string;
  expireDate: string | null;
  comment: string;
}
