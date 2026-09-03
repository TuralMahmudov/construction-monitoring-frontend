import { z } from 'zod';

// New-product branch of § 6.2 — categoryId/name/unitId only matter when a
// brand-new product actually gets created (find-or-create silently ignores
// them on a match, bax productsApi.findOrCreateProduct). description/
// specification/manufacturer/model no longer belong here (2026-07-31 —
// description is server-generated, the other 3 moved to the resource, bax
// resources/utils/resourceListingForm.schema.ts). `brand` is a special case:
// it's neither here nor on the resource — when the category links it, it's
// just another attribute value in `attributes[]` (bax
// FRONTEND_AI_PROMPT_BRAND_IDENTITY.md, AttributeValueField's BRAND branch).
export const productFormSchema = z.object({
  categoryId: z.string().uuid('Kateqoriya seçin.'),
  name: z.string().min(1, 'Ad daxil edin.').max(255, 'Ad 255 simvoldan çox ola bilməz.'),
  unitId: z.string().uuid().nullable(),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;

// § 2.2 — cosmetic-only edit, categoryId/attributes/unitId/code/description
// never appear.
export const productUpdateFormSchema = z.object({
  name: z.string().min(1, 'Ad daxil edin.').max(255, 'Ad 255 simvoldan çox ola bilməz.'),
  active: z.boolean(),
});

export type ProductUpdateFormSchema = z.infer<typeof productUpdateFormSchema>;
