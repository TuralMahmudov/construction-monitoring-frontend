// No `vat` here (unlike the general resource-prices module). Organization
// ownership is implicit (the current user's own org) in both flows now.
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
