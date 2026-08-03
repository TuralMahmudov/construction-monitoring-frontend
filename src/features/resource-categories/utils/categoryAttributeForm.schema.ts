import { z } from 'zod';

export const linkAttributeFormSchema = z.object({
  attributeDefinitionId: z.string().uuid('Atribut seçin.'),
  required: z.boolean(),
  visible: z.boolean(),
  searchable: z.boolean(),
  filterable: z.boolean(),
  sortOrder: z.number().int('Tam ədəd olmalıdır.').min(0, 'Mənfi ola bilməz.'),
  affectsMatchGroup: z.boolean(),
});

export const updateCategoryAttributeFormSchema = linkAttributeFormSchema.omit({
  attributeDefinitionId: true,
});

export type LinkAttributeFormSchema = z.infer<typeof linkAttributeFormSchema>;
export type UpdateCategoryAttributeFormSchema = z.infer<typeof updateCategoryAttributeFormSchema>;
