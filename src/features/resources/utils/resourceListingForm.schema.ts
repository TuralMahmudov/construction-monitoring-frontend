import { z } from 'zod';

// Listing-specific fields (§ 3.1/§ 3.3) — as of 2026-07-31 these live on the
// resource itself, not the product: the same product can be listed by
// different orgs under different manufacturers. `manufacturer` is mandatory
// (backend returns 400 "Manufacturer is required" if blank), the rest are
// optional. `brand` moved OFF the resource onto the product's own attributes
// (FRONTEND_AI_PROMPT_BRAND_IDENTITY.md) — no longer part of this schema,
// hence the rename from the old `resourceBrandFieldsSchema`.
export const resourceListingFieldsSchema = z.object({
  manufacturer: z.string().min(1, 'İstehsalçı daxil edin.').max(255, 'İstehsalçı 255 simvoldan çox ola bilməz.'),
  model: z.string().max(255, 'Model 255 simvoldan çox ola bilməz.'),
  specification: z.string().max(1000, 'Spesifikasiya 1000 simvoldan çox ola bilməz.'),
});

export type ResourceListingFieldsSchema = z.infer<typeof resourceListingFieldsSchema>;

// § 3.3 — PUT /api/resources/{id} accepts active + the listing fields (a
// vendor correcting their own manufacturer name).
export const resourceUpdateFormSchema = resourceListingFieldsSchema.extend({
  active: z.boolean(),
});

export type ResourceUpdateFormSchema = z.infer<typeof resourceUpdateFormSchema>;
